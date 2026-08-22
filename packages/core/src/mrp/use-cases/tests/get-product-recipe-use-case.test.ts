import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError } from '#shared/domain/errors/index.ts'
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
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: GetProductRecipeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
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

  it('denies recipe disclosure to operators', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Operator,
        },
        productId: product.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()
  })
})
