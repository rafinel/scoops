import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import { SalesCatalogProductFaker } from '#pdv/domain/structures/fakers/index.ts'
import { SalesCatalogAvailability } from '#pdv/domain/structures/sales-catalog-availability.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import { ListComboProductsUseCase } from '#pdv/use-cases/list-combo-products-use-case.ts'
import {
  AuthorizationError,
  BadRequestError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'

const actor = { establishmentId: 'establishment-1', profile: UserProfile.Manager }

function portion(
  name: string,
  overrides: { price?: number; isActive?: boolean; isAvailable?: boolean } = {},
): SalesCatalogProduct {
  const { price = 12, isActive = true, isAvailable = true } = overrides
  return SalesCatalogProductFaker.fake({
    name,
    kind: SaleItemKind.Portion,
    isAvailable,
    sizes: [
      {
        sizeId: `${name}-size`,
        name: 'Médio',
        quantity: 1,
        basePrice: price,
        isActive,
        isAvailable,
        accompaniments: [],
      },
    ],
  })
}

function singleResale(
  name: string,
  overrides: { price?: number; isAvailable?: boolean } = {},
): SalesCatalogProduct {
  return SalesCatalogProductFaker.fake({
    name,
    kind: SaleItemKind.Resale,
    stockControl: ProductStockControl.Single,
    isAvailable: overrides.isAvailable ?? true,
    sizes: [],
    resalePrice: overrides.price,
  })
}

function brandResale(
  name: string,
  overrides: { price?: number; isActive?: boolean; isAvailable?: boolean } = {},
): SalesCatalogProduct {
  const { price = 8, isActive = true, isAvailable = true } = overrides
  return SalesCatalogProductFaker.fake({
    name,
    kind: SaleItemKind.Resale,
    stockControl: ProductStockControl.ByBrand,
    isAvailable,
    sizes: [],
    resaleBrands: [
      {
        brandId: `${name}-brand`,
        name: 'Marca',
        basePrice: price,
        isActive,
        isAvailable,
      },
    ],
  })
}

describe('List Combo Products Use Case', () => {
  let catalog: MockProxy<SalesCatalogProvider>
  let useCase: ListComboProductsUseCase

  beforeEach(() => {
    catalog = mock<SalesCatalogProvider>()
    catalog.findAllMatching.mockResolvedValue([])
    useCase = new ListComboProductsUseCase(catalog)
  })

  it('rejects non-manager actors before consulting the provider', async () => {
    await expect(
      useCase.execute({ actor: { ...actor, profile: UserProfile.Operator } }),
    ).rejects.toThrow(new AuthorizationError('Somente gestores podem gerenciar combos.'))
    expect(catalog.findAllMatching).not.toHaveBeenCalled()
  })

  it('requests the unfiltered tenant catalog with the trimmed search and kind', async () => {
    await useCase.execute({
      actor,
      search: '  gelato  ',
      kind: 'portion',
      page: 2,
      pageSize: 10,
    })

    expect(catalog.findAllMatching).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      search: 'gelato',
      kind: 'portion',
    })
  })

  it.each([undefined, '', '   '])('treats search %j as absent', async (search) => {
    await useCase.execute({ actor, search })

    expect(catalog.findAllMatching).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      search: undefined,
      kind: undefined,
    })
  })

  it('lists only available products with availability and isAvailable when there is no search', async () => {
    catalog.findAllMatching.mockResolvedValue([
      portion('a disponível'),
      portion('b sem estoque', { isAvailable: false }),
      portion('c sem preço', { price: Number.NaN }),
      portion('d ambos', { price: Number.POSITIVE_INFINITY, isAvailable: false }),
      singleResale('e grátis', { price: 0 }),
    ])

    const result = await useCase.execute({ actor })

    expect(result.items.map((item) => item.name)).toEqual(['a disponível', 'e grátis'])
    expect(result.items.map((item) => item.availability)).toEqual([
      SalesCatalogAvailability.Available,
      SalesCatalogAvailability.Available,
    ])
    expect(result.items.every((item) => item.isAvailable)).toBe(true)
    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
  })

  it('treats a whitespace-only search as no search and hides unavailable products', async () => {
    catalog.findAllMatching.mockResolvedValue([
      portion('a disponível'),
      portion('b sem estoque', { isAvailable: false }),
    ])

    const result = await useCase.execute({ actor, search: '   ' })

    expect(result.items.map((item) => item.name)).toEqual(['a disponível'])
  })

  it('reveals every active match under a search keeping the provider order', async () => {
    catalog.findAllMatching.mockResolvedValue([
      portion('zz a disponível'),
      portion('zz b sem estoque', { isAvailable: false }),
      portion('zz c sem preço', { price: Number.NaN }),
      portion('zz d ambos', { price: Number.NaN, isAvailable: false }),
      singleResale('zz e grátis', { price: 0 }),
      SalesCatalogProductFaker.fake({ name: 'zz f inativo', isActive: false }),
    ])

    const result = await useCase.execute({ actor, search: 'zz' })

    expect(
      result.items.map((item) => [item.name, item.availability, item.isAvailable]),
    ).toEqual([
      ['zz a disponível', SalesCatalogAvailability.Available, true],
      ['zz b sem estoque', SalesCatalogAvailability.OutOfStock, false],
      ['zz c sem preço', SalesCatalogAvailability.MissingPrice, false],
      ['zz d ambos', SalesCatalogAvailability.MissingPrice, false],
      ['zz e grátis', SalesCatalogAvailability.Available, true],
    ])
    expect(result.total).toBe(5)
  })

  it('excludes inactive products even when searching', async () => {
    catalog.findAllMatching.mockResolvedValue([
      SalesCatalogProductFaker.fake({ name: 'inativo', isActive: false }),
    ])

    const result = await useCase.execute({ actor, search: 'inativo' })

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it.each([
    ['portion available', portion('p'), SalesCatalogAvailability.Available],
    [
      'portion out of stock',
      portion('p', { isAvailable: false }),
      SalesCatalogAvailability.OutOfStock,
    ],
    [
      'portion without active size',
      portion('p', { isActive: false }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'portion negative price',
      portion('p', { price: -1 }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'portion non-finite price',
      portion('p', { price: Number.NaN }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'portion zero price',
      portion('p', { price: 0 }),
      SalesCatalogAvailability.Available,
    ],
    [
      'portion missing price and stock',
      portion('p', { price: Number.NaN, isAvailable: false }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'single resale available',
      singleResale('r', { price: 5 }),
      SalesCatalogAvailability.Available,
    ],
    [
      'single resale out of stock',
      singleResale('r', { price: 5, isAvailable: false }),
      SalesCatalogAvailability.OutOfStock,
    ],
    [
      'single resale without price',
      singleResale('r'),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'single resale negative price',
      singleResale('r', { price: -0.01 }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'single resale non-finite price',
      singleResale('r', { price: Number.POSITIVE_INFINITY }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'single resale zero price',
      singleResale('r', { price: 0 }),
      SalesCatalogAvailability.Available,
    ],
    [
      'single resale without price and stock',
      singleResale('r', { isAvailable: false }),
      SalesCatalogAvailability.MissingPrice,
    ],
    ['brand resale available', brandResale('b'), SalesCatalogAvailability.Available],
    [
      'brand resale out of stock',
      brandResale('b', { isAvailable: false }),
      SalesCatalogAvailability.OutOfStock,
    ],
    [
      'brand resale without active brand',
      brandResale('b', { isActive: false }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'brand resale negative price',
      brandResale('b', { price: -3 }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'brand resale non-finite price',
      brandResale('b', { price: Number.NaN }),
      SalesCatalogAvailability.MissingPrice,
    ],
    [
      'brand resale zero price',
      brandResale('b', { price: 0 }),
      SalesCatalogAvailability.Available,
    ],
    [
      'brand resale missing price and stock',
      brandResale('b', { isActive: false, isAvailable: false }),
      SalesCatalogAvailability.MissingPrice,
    ],
  ])('classifies %s', async (_label, product, expected) => {
    catalog.findAllMatching.mockResolvedValue([product])

    const result = await useCase.execute({ actor, search: 'x' })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.availability).toBe(expected)
    expect(result.items[0]?.isAvailable).toBe(
      expected === SalesCatalogAvailability.Available,
    )
  })

  it('does not reveal unavailable products through the kind filter alone', async () => {
    catalog.findAllMatching.mockResolvedValue([
      brandResale('b disponível'),
      brandResale('b sem estoque', { isAvailable: false }),
    ])

    const withoutSearch = await useCase.execute({ actor, kind: 'resale' })
    const withSearch = await useCase.execute({ actor, kind: 'resale', search: 'b' })

    expect(withoutSearch.items.map((item) => item.name)).toEqual(['b disponível'])
    expect(withSearch.items.map((item) => item.name)).toEqual([
      'b disponível',
      'b sem estoque',
    ])
  })

  it('paginates the filtered set and reports its total', async () => {
    catalog.findAllMatching.mockResolvedValue([
      portion('p1'),
      portion('x1', { isAvailable: false }),
      portion('p2'),
      portion('p3'),
      portion('p4'),
      portion('p5'),
    ])

    const first = await useCase.execute({ actor, page: 1, pageSize: 2 })
    const second = await useCase.execute({ actor, page: 2, pageSize: 2 })
    const third = await useCase.execute({ actor, page: 3, pageSize: 2 })
    const beyond = await useCase.execute({ actor, page: 4, pageSize: 2 })

    expect(first.items.map((item) => item.name)).toEqual(['p1', 'p2'])
    expect(second.items.map((item) => item.name)).toEqual(['p3', 'p4'])
    expect(third.items.map((item) => item.name)).toEqual(['p5'])
    expect(beyond.items).toEqual([])
    expect([first.page, first.pageSize, first.total, first.totalPages]).toEqual([
      1, 2, 5, 3,
    ])
    expect([beyond.page, beyond.total, beyond.totalPages]).toEqual([4, 5, 3])
  })

  it('paginates all matches under a search', async () => {
    catalog.findAllMatching.mockResolvedValue([
      portion('p1'),
      portion('p2', { isAvailable: false }),
      portion('p3', { price: Number.NaN }),
    ])

    const result = await useCase.execute({ actor, search: 'p', page: 2, pageSize: 2 })

    expect(result.items.map((item) => item.name)).toEqual(['p3'])
    expect([result.total, result.totalPages]).toEqual([3, 2])
  })

  it('returns an empty first page when nothing matches', async () => {
    const result = await useCase.execute({ actor })

    expect(result.items).toEqual([])
    expect([result.page, result.pageSize, result.total, result.totalPages]).toEqual([
      1, 20, 0, 0,
    ])
  })

  it('accepts the minimum and maximum page sizes', async () => {
    await expect(useCase.execute({ actor, pageSize: 1 })).resolves.toMatchObject({
      pageSize: 1,
    })
    await expect(useCase.execute({ actor, pageSize: 50 })).resolves.toMatchObject({
      pageSize: 50,
    })
  })

  it.each([
    ['zero page', { page: 0 }],
    ['fractional page', { page: 1.5 }],
    ['zero page size', { pageSize: 0 }],
    ['fractional page size', { pageSize: 1.5 }],
    ['page size above the limit', { pageSize: 51 }],
    ['too long search', { search: 'x'.repeat(121) }],
  ])('rejects %s before consulting the provider', async (_label, input) => {
    await expect(useCase.execute({ actor, ...input })).rejects.toThrow(
      new BadRequestError('Os parâmetros de catálogo são inválidos.'),
    )

    expect(catalog.findAllMatching).not.toHaveBeenCalled()
  })

  it('accepts a search with the maximum length', async () => {
    await useCase.execute({ actor, search: 'x'.repeat(120) })

    expect(catalog.findAllMatching).toHaveBeenCalledOnce()
  })

  it('wraps unexpected provider failures as service unavailable', async () => {
    catalog.findAllMatching.mockRejectedValue(new Error('network failure'))

    await expect(useCase.execute({ actor })).rejects.toThrow(
      new ServiceUnavailableError('Não foi possível consultar o catálogo de produtos.'),
    )
  })

  it('keeps known application errors from the provider', async () => {
    const error = new ServiceUnavailableError('O catálogo de produtos está indisponível.')
    catalog.findAllMatching.mockRejectedValue(error)

    await expect(useCase.execute({ actor })).rejects.toBe(error)
  })
})
