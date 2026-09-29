import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { GetProductRecipeUseCase } from '#mrp/use-cases/get-product-recipe-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})

describe('Get Product Recipe Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: GetProductRecipeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    useCase = new GetProductRecipeUseCase(database)
  })

  it('returns a null recipe without creating one', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
    })
    expect(result).toEqual({ product, recipe: null })
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })

  it('allows operators to read recipes without creating them', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Operator,
        },
        productId: product.id,
      }),
    ).resolves.toEqual({ product, recipe: null })
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })
})
