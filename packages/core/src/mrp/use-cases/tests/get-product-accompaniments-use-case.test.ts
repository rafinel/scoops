import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { GetProductAccompanimentsUseCase } from '#mrp/use-cases/get-product-accompaniments-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  name: 'Sunday Portion',
  categories: [ProductCategory.Portion],
})
const single = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  name: 'Biscuit',
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: 2.5,
})
const byBrand = ProductFaker.fake({
  id: 'brand-1',
  establishmentId,
  name: 'Apple Syrup',
  categories: [ProductCategory.Accompaniment],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
})
const unavailable = ProductFaker.fake({
  id: 'unavailable-1',
  establishmentId,
  name: 'Zest',
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: undefined,
})
const singleLink = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: single.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 2,
})
const brandLink = ProductAccompanimentFaker.fake({
  id: 'link-2',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: byBrand.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 0.25,
})
const unavailableLink = ProductAccompanimentFaker.fake({
  id: 'link-3',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: unavailable.id,
  accompanimentTypeId: 'type-1',
  quantityPerPortion: 1,
})

describe('Get Product Accompaniments Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: GetProductAccompanimentsUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === owner.id) return owner
      if (id === single.id) return single
      if (id === byBrand.id) return byBrand
      if (id === unavailable.id) return unavailable
      return undefined
    })
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      unavailableLink,
      brandLink,
      singleLink,
    ])
    scope.accompanimentTypesRepository.findById.mockResolvedValue(
      AccompanimentTypeFaker.fake({ id: 'type-1', establishmentId, name: '  Extras  ' }),
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'brand-main',
        productId: byBrand.id,
        name: 'Main Brand',
        packageQuantity: 2,
        packagePrice: 10,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    useCase = new GetProductAccompanimentsUseCase(database)
  })

  it('projects current Single and Main-brand sources, omitting commercial price', async () => {
    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
    })

    expect(result.product).toBe(owner)
    expect(result.accompaniments.map((item) => item.accompanimentProductName)).toEqual([
      'Apple Syrup',
      'Biscuit',
      'Zest',
    ])
    expect(result.accompaniments[0]).toMatchObject({
      brandId: 'brand-main',
      brandName: 'Main Brand',
      unitCost: 5,
      estimatedCost: 1.25,
    })
    expect(result.accompaniments[1]).toMatchObject({ unitCost: 2.5, estimatedCost: 5 })
    expect(result.accompaniments[2]).not.toHaveProperty('unitCost')
    expect(result.accompaniments[2]).not.toHaveProperty('estimatedCost')
    expect(result.accompaniments[0]).not.toHaveProperty('price')
  })

  it('rejects operators and non-Portion or missing owners without revealing data', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId, profile: UserProfile.Operator },
        productId: owner.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    scope.productsRepository.findById.mockResolvedValue(single)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: single.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: 'foreign-owner',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
