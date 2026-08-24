import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { SaveProductResaleConfigurationUseCase } from '#mrp/use-cases/save-product-resale-configuration-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const singleProduct = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  currentUnitCost: undefined,
})
const byBrandProduct = ProductFaker.fake({
  id: 'by-brand-1',
  establishmentId,
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
})
const brand = {
  id: 'brand-1',
  productId: byBrandProduct.id,
  name: 'Main Brand',
  packageQuantity: 4,
  packagePrice: 20,
  isPrimary: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('Save Product Resale Configuration Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: SaveProductResaleConfigurationUseCase
  let singleConfiguration: ResaleConfiguration | undefined
  let brandConfiguration: ResaleConfiguration | undefined

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    singleConfiguration = undefined
    brandConfiguration = undefined
    scope.productsRepository.findById.mockImplementation(
      async (_establishment, productId) => {
        if (productId === singleProduct.id) return singleProduct
        if (productId === byBrandProduct.id) return byBrandProduct
        return undefined
      },
    )
    scope.brandsRepository.findById.mockImplementation(async (_productId, brandId) => {
      return brandId === brand.id ? brand : undefined
    })
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])
    scope.resaleConfigurationsRepository.findByProductAndBrand.mockImplementation(
      async (_establishment, productId, brandId) => {
        if (productId === singleProduct.id && brandId === undefined) {
          return singleConfiguration
        }
        if (productId === byBrandProduct.id && brandId === brand.id) {
          return brandConfiguration
        }
        return undefined
      },
    )
    scope.resaleConfigurationsRepository.findManyByProductId.mockImplementation(
      async (_establishment, productId) => {
        if (productId === byBrandProduct.id && brandConfiguration) {
          return [brandConfiguration]
        }
        return []
      },
    )
    scope.resaleConfigurationsRepository.add.mockImplementation(async (input) => {
      const configuration = ResaleConfigurationFaker.fake({
        id: input.brandId ? 'brand-configuration' : 'single-configuration',
        ...input,
      })
      if (input.brandId) brandConfiguration = configuration
      else singleConfiguration = configuration
      return configuration
    })
    scope.resaleConfigurationsRepository.replace.mockImplementation(
      async (_establishment, _productId, configurationId, changes) => {
        const current =
          configurationId === 'single-configuration'
            ? singleConfiguration
            : brandConfiguration
        if (!current) throw new Error('Expected an existing resale configuration.')
        const configuration = { ...current, ...changes }
        if (configurationId === 'single-configuration')
          singleConfiguration = configuration
        else brandConfiguration = configuration
        return configuration
      },
    )
    useCase = new SaveProductResaleConfigurationUseCase(database)
  })

  it('creates and returns the Single-stock configuration with package quantity one', async () => {
    const result = await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 8.5, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: singleProduct.id,
      price: 8.5,
      isActive: true,
    })
    expect(result).toMatchObject({
      mode: 'resale-single',
      resale: [{ packageQuantity: 1, price: 8.5, isActive: true }],
    })
  })

  it('updates an existing Single configuration idempotently without adding a duplicate', async () => {
    singleConfiguration = ResaleConfigurationFaker.fake({
      id: 'single-configuration',
      establishmentId,
      productId: singleProduct.id,
      price: 5,
      isActive: false,
    })

    await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 6, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      singleProduct.id,
      'single-configuration',
      { price: 6, isActive: true },
    )
    expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
  })

  it('saves only the owned By-brand configuration and inherits package facts', async () => {
    const result = await useCase.execute({
      actor,
      productId: byBrandProduct.id,
      brandId: brand.id,
      input: { price: 15, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: byBrandProduct.id,
      brandId: brand.id,
      price: 15,
      isActive: true,
    })
    expect(result).toMatchObject({
      mode: 'resale-by-brand',
      resale: [{ brand, packageQuantity: 4, price: 15, isActive: true }],
    })
  })

  it('rejects wrong modes, missing or foreign brands, invalid input and non-Managers', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: byBrandProduct.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor,
        productId: singleProduct.id,
        brandId: brand.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor,
        productId: byBrandProduct.id,
        brandId: 'foreign-brand',
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor,
        productId: singleProduct.id,
        input: { price: 10.001, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: singleProduct.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
