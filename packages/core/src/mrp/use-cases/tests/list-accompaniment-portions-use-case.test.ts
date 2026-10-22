import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import { ListAccompanimentPortionsUseCase } from '#mrp/use-cases/list-accompaniment-portions-use-case.ts'

const establishmentId = 'establishment-1'
const manager = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const operator = { id: 'operator-1', establishmentId, profile: UserProfile.Operator }
const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  name: 'Granola',
  unit: ProductUnit.Kilogram,
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: 4,
  accompanimentPrice: 9,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Toppings',
})
const otherType = AccompanimentTypeFaker.fake({
  id: 'type-2',
  establishmentId,
  name: 'Sauces',
})
const acai = ProductFaker.fake({
  id: 'portion-acai',
  establishmentId,
  name: 'Açaí',
  categories: [ProductCategory.Portion],
})
const banana = ProductFaker.fake({
  id: 'portion-banana',
  establishmentId,
  name: 'Banana',
  categories: [ProductCategory.Portion],
})
const acaiLink = ProductAccompanimentFaker.fake({
  id: 'link-acai',
  establishmentId,
  productId: acai.id,
  accompanimentProductId: accompaniment.id,
  accompanimentTypeId: type.id,
  quantityPerPortion: 0.5,
  accompanimentPrice: 3.5,
})
const bananaLink = ProductAccompanimentFaker.fake({
  id: 'link-banana',
  establishmentId,
  productId: banana.id,
  accompanimentProductId: accompaniment.id,
  accompanimentTypeId: otherType.id,
  quantityPerPortion: 2,
  accompanimentPrice: 5,
})

function page(
  items: (typeof acaiLink)[],
  overrides: { page?: number; total?: number; totalPages?: number } = {},
) {
  return new PaginationResponse(
    items,
    overrides.page ?? 1,
    10,
    overrides.total ?? items.length,
    overrides.totalPages ?? 1,
  )
}

describe('List Accompaniment Portions Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: ListAccompanimentPortionsUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(accompaniment)
    scope.productsRepository.findManyByIds.mockResolvedValue([acai, banana])
    scope.productsRepository.existsByCategory.mockResolvedValue(true)
    scope.accompanimentTypesRepository.findById.mockImplementation(async (_, id) =>
      id === type.id ? type : id === otherType.id ? otherType : undefined,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      2,
    )
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([acaiLink, bananaLink]),
    )
    useCase = new ListAccompanimentPortionsUseCase(database)
  })

  it('returns the repository page with the existing row projection plus Portion id and name', async () => {
    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toEqual({
      items: [
        {
          id: acaiLink.id,
          accompanimentProductId: accompaniment.id,
          accompanimentProductName: 'Granola',
          accompanimentTypeId: type.id,
          accompanimentTypeName: 'Toppings',
          unit: ProductUnit.Kilogram,
          quantityPerPortion: 0.5,
          salePrice: 3.5,
          isGlobal: false,
          hasOtherPortionLinks: true,
          unitCost: 4,
          estimatedCost: 2,
          portionProductId: acai.id,
          portionProductName: 'Açaí',
        },
        {
          id: bananaLink.id,
          accompanimentProductId: accompaniment.id,
          accompanimentProductName: 'Granola',
          accompanimentTypeId: otherType.id,
          accompanimentTypeName: 'Sauces',
          unit: ProductUnit.Kilogram,
          quantityPerPortion: 2,
          salePrice: 5,
          isGlobal: false,
          hasOtherPortionLinks: true,
          unitCost: 4,
          estimatedCost: 8,
          portionProductId: banana.id,
          portionProductName: 'Banana',
        },
      ],
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
      hasPortionProducts: true,
    })
    expect(
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId,
    ).toHaveBeenCalledTimes(1)
  })

  it('lets Operators read the same page', async () => {
    await expect(
      useCase.execute({ actor: operator, productId: accompaniment.id }),
    ).resolves.toMatchObject({ total: 2, hasPortionProducts: true })
  })

  it('rejects an unknown profile before opening a transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...manager, profile: 'visitor' as UserProfile },
        productId: accompaniment.id,
      }),
    ).rejects.toThrow(
      new AuthorizationError('Somente gestores e operadores podem consultar porções.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('normalizes defaults and search before reading the page', async () => {
    await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      search: '  AÇA ',
    })
    await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      search: '   ',
      page: 3,
      pageSize: 25,
    })

    const calls =
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mock.calls
    expect(calls[0][0]).toEqual({
      establishmentId,
      accompanimentProductId: accompaniment.id,
      search: 'AÇA',
      page: 1,
      pageSize: 10,
    })
    expect(calls[1][0]).toEqual({
      establishmentId,
      accompanimentProductId: accompaniment.id,
      search: undefined,
      page: 3,
      pageSize: 25,
    })
  })

  const invalidPageMessage = 'A página deve ser um número inteiro positivo.'
  const invalidPageSizeMessage = 'O tamanho da página deve estar entre 1 e 100.'

  it.each([
    { pagination: { page: 0 }, message: invalidPageMessage },
    { pagination: { page: -1 }, message: invalidPageMessage },
    { pagination: { page: 1.5 }, message: invalidPageMessage },
    { pagination: { pageSize: 0 }, message: invalidPageSizeMessage },
    { pagination: { pageSize: 101 }, message: invalidPageSizeMessage },
    { pagination: { pageSize: 2.5 }, message: invalidPageSizeMessage },
  ])(
    'rejects invalid pagination $pagination before any read',
    async ({ pagination, message }) => {
      await expect(
        useCase.execute({ actor: manager, productId: accompaniment.id, ...pagination }),
      ).rejects.toThrow(new BadRequestError(message))
      expect(database.run).not.toHaveBeenCalled()
    },
  )

  it('accepts the page and page size boundaries', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([acaiLink], { total: 5, totalPages: 5 }),
    )
    await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      page: 1,
      pageSize: 100,
    })
    await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      page: 2,
      pageSize: 1,
    })

    const calls =
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mock.calls
    expect(calls.map(([params]) => [params.page, params.pageSize])).toEqual([
      [1, 100],
      [2, 1],
    ])
  })

  it('re-reads the last page when the requested page is beyond it', async () => {
    const lastPage = page([acaiLink], { page: 3, total: 21, totalPages: 3 })
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId
      .mockResolvedValueOnce(page([], { page: 9, total: 21, totalPages: 3 }))
      .mockResolvedValueOnce(lastPage)

    const result = await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      page: 9,
    })

    const calls =
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0].page).toBe(9)
    expect(calls[1][0]).toMatchObject({ page: 3, pageSize: 10 })
    expect(result).toMatchObject({ page: 3, total: 21, totalPages: 3 })
    expect(result.items.map((item) => item.id)).toEqual([acaiLink.id])
  })

  it('does not re-read when the requested page is the last one or the listing is empty', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValueOnce(
      page([acaiLink], { page: 3, total: 21, totalPages: 3 }),
    )
    await useCase.execute({ actor: manager, productId: accompaniment.id, page: 3 })
    expect(
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId,
    ).toHaveBeenCalledTimes(1)

    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockClear()
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([], { page: 4, total: 0, totalPages: 0 }),
    )
    const empty = await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      page: 4,
    })

    expect(
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId,
    ).toHaveBeenCalledTimes(1)
    expect(empty).toMatchObject({ items: [], total: 0, totalPages: 0 })
  })

  it('skips Portion, type, brand and count reads for an empty page and still reports Portions', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([], { total: 0, totalPages: 0 }),
    )
    scope.productsRepository.existsByCategory.mockResolvedValue(false)

    const result = await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
      search: 'zzz',
    })

    expect(result).toMatchObject({ items: [], hasPortionProducts: false })
    expect(scope.productsRepository.existsByCategory).toHaveBeenCalledWith(
      establishmentId,
      ProductCategory.Portion,
    )
    expect(scope.productsRepository.findManyByIds).not.toHaveBeenCalled()
    expect(scope.brandsRepository.findManyByProductId).not.toHaveBeenCalled()
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).not.toHaveBeenCalled()
  })

  it('reads Portions, types, brands and the link count once for the whole page', async () => {
    await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(scope.productsRepository.findManyByIds).toHaveBeenCalledTimes(1)
    expect(scope.productsRepository.findManyByIds).toHaveBeenCalledWith(establishmentId, [
      acai.id,
      banana.id,
    ])
    expect(scope.accompanimentTypesRepository.findById).toHaveBeenCalledTimes(2)
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledTimes(1)
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      accompaniment.id,
    )
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).toHaveBeenCalledTimes(1)
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
  })

  it('reads each shared type once', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([acaiLink, { ...bananaLink, accompanimentTypeId: type.id }]),
    )

    await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(scope.accompanimentTypesRepository.findById).toHaveBeenCalledTimes(1)
  })

  it("shows the global's price on every global row, not a stale own price or the default", async () => {
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentPrice: 6.25,
      }),
    )
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([
        { ...acaiLink, globalAccompanimentId: 'global-1' },
        {
          ...bananaLink,
          globalAccompanimentId: 'global-1',
          accompanimentPrice: undefined,
        },
      ]),
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items.map((item) => item.salePrice)).toEqual([6.25, 6.25])
    expect(
      scope.globalAccompanimentsRepository.findByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
  })

  it('reports null for a global row whose global has no price', async () => {
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentPrice: undefined,
      }),
    )
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([{ ...acaiLink, globalAccompanimentId: 'global-1' }]),
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items[0].salePrice).toBeNull()
  })

  it('marks global rows without other individual links', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([
        { ...acaiLink, globalAccompanimentId: 'global-1' },
        { ...bananaLink, globalAccompanimentId: 'global-1' },
      ]),
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(
      result.items.map((item) => [item.isGlobal, item.hasOtherPortionLinks]),
    ).toEqual([
      [true, false],
      [true, false],
    ])
  })

  it('reports no other links when the Accompaniment has a single row', async () => {
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      1,
    )
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([acaiLink]),
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items[0].hasOtherPortionLinks).toBe(false)
  })

  it('uses the main brand cost for a By-brand Accompaniment', async () => {
    const byBrand = {
      ...accompaniment,
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    }
    scope.productsRepository.findById.mockResolvedValue(byBrand)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      BrandFaker.fake({
        id: 'brand-1',
        productId: accompaniment.id,
        name: 'House',
        packageQuantity: 4,
        packagePrice: 12,
      }),
    ])

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items[0]).toMatchObject({
      brandId: 'brand-1',
      brandName: 'House',
      unitCost: 3,
      estimatedCost: 1.5,
    })
  })

  it('omits cost fields for an inactive Accompaniment but keeps the saved price', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      status: ProductStatus.Inactive,
    })

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items[0]).toMatchObject({ salePrice: 3.5 })
    expect(result.items[0]).not.toHaveProperty('unitCost')
    expect(result.items[0]).not.toHaveProperty('estimatedCost')
  })

  it('reports an unset price as null even when the default price is set', async () => {
    scope.productAccompanimentsRepository.findPageByAccompanimentProductId.mockResolvedValue(
      page([{ ...acaiLink, accompanimentPrice: undefined }]),
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.items[0].salePrice).toBeNull()
  })

  it.each([
    { name: 'missing', product: undefined },
    {
      name: 'foreign',
      product: { ...accompaniment, establishmentId: 'another-establishment' },
    },
  ])('rejects a $name route product', async ({ product }) => {
    scope.productsRepository.findById.mockResolvedValue(product)

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      accompaniment.id,
    )
    expect(
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId,
    ).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'lacks the Accompaniment category', categories: [ProductCategory.Portion] },
    {
      name: 'is a legacy Portion and Accompaniment',
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    },
  ])('rejects a product that $name', async ({ categories }) => {
    scope.productsRepository.findById.mockResolvedValue({ ...accompaniment, categories })

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(
      new BadRequestError('O produto não é um acompanhamento elegível para porções.'),
    )
    expect(
      scope.productAccompanimentsRepository.findPageByAccompanimentProductId,
    ).not.toHaveBeenCalled()
  })

  it('rejects a row whose Portion or type is missing or belongs to another tenant', async () => {
    scope.productsRepository.findManyByIds.mockResolvedValue([
      { ...acai, establishmentId: 'another-establishment' },
      banana,
    ])
    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new NotFoundError('Porção não encontrada.'))

    scope.productsRepository.findManyByIds.mockResolvedValue([acai, banana])
    scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new NotFoundError('Tipo de acompanhamento não encontrado.'))

    scope.accompanimentTypesRepository.findById.mockResolvedValue({
      ...type,
      establishmentId: 'another-establishment',
    })
    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new NotFoundError('Tipo de acompanhamento não encontrado.'))
  })

  it('never writes', async () => {
    await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
  })
})
