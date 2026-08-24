import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductSizeFaker,
  ProductFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { GetProductPricingUseCase } from '#mrp/use-cases/get-product-pricing-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const portion = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  name: 'Ice Cream',
  unit: ProductUnit.Kilogram,
  categories: [ProductCategory.Portion],
  currentUnitCost: 2,
})
const resaleSingle = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  name: 'Soda',
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  currentUnitCost: undefined,
})
const resaleByBrand = ProductFaker.fake({
  id: 'by-brand-1',
  establishmentId,
  name: 'Coffee',
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
})
const unavailableCostPortion = ProductFaker.fake({
  id: 'portion-without-cost-1',
  establishmentId,
  name: 'Unpriced Ice Cream',
  categories: [ProductCategory.Portion],
  currentUnitCost: undefined,
})
const sizes = [
  ProductSizeFaker.fake({
    id: 'size-small',
    establishmentId,
    productId: portion.id,
    name: 'Small',
    quantity: 0.5,
    price: 4,
  }),
  ProductSizeFaker.fake({
    id: 'size-free',
    establishmentId,
    productId: portion.id,
    name: 'Free',
    quantity: 1,
    price: 0,
    isActive: false,
  }),
]
const singleConfiguration = ResaleConfigurationFaker.fake({
  id: 'single-configuration',
  establishmentId,
  productId: resaleSingle.id,
  price: 7.5,
  isActive: true,
})
const mainBrand = {
  id: 'brand-main',
  productId: resaleByBrand.id,
  name: 'Main Brand',
  packageQuantity: 6,
  packagePrice: 30,
  isPrimary: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const secondaryBrand = { ...mainBrand, id: 'brand-secondary', name: 'Secondary' }
const mainBrandConfiguration = ResaleConfigurationFaker.fake({
  id: 'brand-configuration',
  establishmentId,
  productId: resaleByBrand.id,
  brandId: mainBrand.id,
  price: 12,
  isActive: true,
})

describe('Get Product Pricing Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: GetProductPricingUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(
      async (_establishment, productId): Promise<Product | undefined> => {
        return [portion, unavailableCostPortion, resaleSingle, resaleByBrand].find(
          (product) => product.id === productId,
        )
      },
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue(sizes)
    scope.resaleConfigurationsRepository.findByProductAndBrand.mockImplementation(
      async (_establishment, productId, brandId) => {
        if (productId === resaleSingle.id && brandId === undefined) {
          return singleConfiguration
        }
        return undefined
      },
    )
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([
      mainBrandConfiguration,
    ])
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      mainBrand,
      secondaryBrand,
    ])
    useCase = new GetProductPricingUseCase(database)
  })

  it('projects Portion sizes with optional cost, profit and zero-price margin handling', async () => {
    const result = await useCase.execute({ actor, productId: portion.id })

    expect(result).toMatchObject({ product: portion, mode: 'portion', resale: [] })
    expect(result.sizes).toEqual([
      {
        size: sizes[0],
        operatingCost: 1,
        profit: 3,
        marginPercentage: 75,
      },
      { size: sizes[1], operatingCost: 2, profit: -2 },
    ])
    expect(scope.productSizesRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      portion.id,
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('projects Single and By-brand resale without creating an unbranded fallback', async () => {
    const singleResult = await useCase.execute({ actor, productId: resaleSingle.id })

    expect(singleResult).toMatchObject({
      mode: 'resale-single',
      sizes: [],
      resale: [
        {
          configuration: singleConfiguration,
          packageQuantity: 1,
          price: 7.5,
          isActive: true,
        },
      ],
    })

    const byBrandResult = await useCase.execute({ actor, productId: resaleByBrand.id })

    expect(byBrandResult.resale).toEqual([
      {
        configuration: mainBrandConfiguration,
        brand: mainBrand,
        packageQuantity: 6,
        price: 12,
        isActive: true,
      },
      {
        brand: secondaryBrand,
        packageQuantity: 6,
        isActive: false,
      },
    ])
  })

  it('omits financial metrics when no current cost can be resolved', async () => {
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        price: 4,
      }),
    ])
    const result = await useCase.execute({
      actor,
      productId: unavailableCostPortion.id,
    })

    expect(result.sizes[0]).toEqual({ size: expect.any(Object) })
    expect(result.sizes[0]).not.toHaveProperty('operatingCost')
    expect(result.sizes[0]).not.toHaveProperty('profit')
    expect(result.sizes[0]).not.toHaveProperty('marginPercentage')
  })

  it('requires a Manager and hides foreign or unsupported products', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: portion.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: 'foreign-product' }),
    ).rejects.toBeInstanceOf(NotFoundError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'ingredient-1',
        establishmentId,
        categories: [ProductCategory.Ingredient],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'ingredient-1' }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })
})
