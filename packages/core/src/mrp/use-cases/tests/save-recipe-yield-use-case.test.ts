import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, RecipeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError } from '#shared/domain/errors/index.ts'
import { SaveRecipeYieldUseCase } from '#mrp/use-cases/save-recipe-yield-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})

describe('Save Recipe Yield Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: SaveRecipeYieldUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipesRepository.findByProductId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(
        RecipeFaker.fake({
          id: 'recipe-1',
          establishmentId: product.establishmentId,
          productId: product.id,
          yieldQuantity: 2,
        }),
      )
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])
    useCase = new SaveRecipeYieldUseCase(database)
  })

  it('creates an empty recipe only after a valid explicit yield', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { yieldQuantity: 2 },
    })

    expect(scope.recipesRepository.add).toHaveBeenCalledWith({
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity: 2,
    })
    expect(result.recipe?.ingredients).toEqual([])
  })

  it('rejects invalid precision without a write', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
        input: { yieldQuantity: 1.0001 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })
})
