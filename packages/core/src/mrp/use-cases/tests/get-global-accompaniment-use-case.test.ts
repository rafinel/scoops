import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  GlobalAccompanimentFaker,
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
import { GetGlobalAccompanimentUseCase } from '#mrp/use-cases/get-global-accompaniment-use-case.ts'

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
  accompanimentPrice: 3.5,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Toppings',
})
const global = GlobalAccompanimentFaker.fake({
  id: 'global-1',
  establishmentId,
  accompanimentProductId: accompaniment.id,
  accompanimentTypeId: type.id,
  quantityPerPortion: 0.5,
  accompanimentPrice: 5.25,
})

describe('Get Global Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: GetGlobalAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(accompaniment)
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      global,
    )
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])
    useCase = new GetGlobalAccompanimentUseCase(database)
  })

  it('returns the shared values, price and cost of a global Accompaniment', async () => {
    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      isGlobal: true,
      unit: ProductUnit.Kilogram,
      salePrice: 5.25,
      globalAccompanimentId: global.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Toppings',
      quantityPerPortion: 0.5,
      unitCost: 4,
      estimatedCost: 2,
    })
    expect(
      scope.globalAccompanimentsRepository.findByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
    expect(scope.accompanimentTypesRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      type.id,
    )
  })

  it('lets Operators read the same global details', async () => {
    await expect(
      useCase.execute({ actor: operator, productId: accompaniment.id }),
    ).resolves.toMatchObject({ isGlobal: true, quantityPerPortion: 0.5 })
  })

  it('rejects an unknown profile before opening a transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...manager, profile: 'visitor' as UserProfile },
        productId: accompaniment.id,
      }),
    ).rejects.toThrow(
      new AuthorizationError(
        'Somente gestores e operadores podem consultar acompanhamentos globais.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('returns only the product facts for a non-global Accompaniment', async () => {
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      isGlobal: false,
      unit: ProductUnit.Kilogram,
      salePrice: 3.5,
    })
    expect(scope.accompanimentTypesRepository.findById).not.toHaveBeenCalled()
    expect(scope.brandsRepository.findManyByProductId).not.toHaveBeenCalled()
  })

  it("reports the global's own price instead of the default, and null when the global has none", async () => {
    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })
    expect(result.salePrice).toBe(5.25)

    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue({
      ...global,
      accompanimentPrice: undefined,
    })
    const unpriced = await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
    })
    expect(unpriced.salePrice).toBeNull()
  })

  it('reports an unset price as null', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      accompanimentPrice: undefined,
    })
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.salePrice).toBeNull()
  })

  it('answers isGlobal false for a legacy Portion and Accompaniment product', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    })
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).resolves.toMatchObject({ isGlobal: false })
  })

  it('uses the main brand cost of a By-brand global Accompaniment', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
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

    expect(result).toMatchObject({
      brandId: 'brand-1',
      brandName: 'House',
      unitCost: 3,
      estimatedCost: 1.5,
    })
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      accompaniment.id,
    )
  })

  it('carries no brand or cost fields for a non-global By-brand Accompaniment with a main brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    scope.globalAccompanimentsRepository.findByAccompanimentProductId.mockResolvedValue(
      undefined,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      BrandFaker.fake({
        productId: accompaniment.id,
        isPrimary: true,
        packageQuantity: 4,
        packagePrice: 12,
      }),
    ])

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toEqual({
      accompanimentProductId: accompaniment.id,
      accompanimentProductName: 'Granola',
      isGlobal: false,
      unit: ProductUnit.Kilogram,
      salePrice: 3.5,
    })
  })

  it('omits cost fields when the Accompaniment has no unit cost or no usable main brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      currentUnitCost: undefined,
    })
    const withoutUnitCost = await useCase.execute({
      actor: manager,
      productId: accompaniment.id,
    })

    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      stockControl: ProductStockControl.ByBrand,
    })
    for (const brands of [
      [],
      [BrandFaker.fake({ productId: accompaniment.id, isPrimary: false })],
      [BrandFaker.fake({ productId: 'another-product', isPrimary: true })],
      [
        BrandFaker.fake({
          productId: accompaniment.id,
          isPrimary: true,
          packageQuantity: 0,
        }),
      ],
    ]) {
      scope.brandsRepository.findManyByProductId.mockResolvedValue(brands)
      const result = await useCase.execute({
        actor: manager,
        productId: accompaniment.id,
      })
      expect(result).toMatchObject({ isGlobal: true, salePrice: 5.25 })
      expect(result).not.toHaveProperty('unitCost')
      expect(result).not.toHaveProperty('estimatedCost')
      expect(result).not.toHaveProperty('brandId')
      expect(result).not.toHaveProperty('brandName')
    }
    expect(withoutUnitCost).not.toHaveProperty('unitCost')
  })

  it('reports a zero unit cost as a cost', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      currentUnitCost: 0,
    })

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).resolves.toMatchObject({ unitCost: 0, estimatedCost: 0 })
  })

  it('omits cost fields for an inactive global Accompaniment but still returns it', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      status: ProductStatus.Inactive,
    })

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toMatchObject({ isGlobal: true, salePrice: 5.25 })
    expect(result).not.toHaveProperty('unitCost')
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
    expect(
      scope.globalAccompanimentsRepository.findByAccompanimentProductId,
    ).not.toHaveBeenCalled()
  })

  it('rejects a product without the Accompaniment category', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...accompaniment,
      categories: [ProductCategory.Portion],
    })

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new BadRequestError('O produto não é um acompanhamento.'))
    expect(
      scope.globalAccompanimentsRepository.findByAccompanimentProductId,
    ).not.toHaveBeenCalled()
  })

  it('rejects a global whose type is missing or belongs to another tenant', async () => {
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
})
