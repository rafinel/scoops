import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { PreviewProductionUseCase } from '#mrp/use-cases/preview-production-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})
const ingredient = ProductFaker.fake({
  id: 'ingredient-1',
  establishmentId: product.establishmentId,
  name: 'Milk',
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  currentUnitCost: 2,
})

describe('Preview Production Use Case', () => {
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: PreviewProductionUseCase

  beforeEach(() => {
    const database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredient,
    )
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        yieldQuantity: 2,
      }),
    )
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: 'recipe-1',
        ingredientProductId: ingredient.id,
        quantity: 2,
      }),
    ])
    scope.stockBalancesRepository.findByProductId.mockImplementation(async (id) => ({
      productId: id,
      quantity: id === product.id ? 1 : 0,
      situation: 'normal',
    }))
    useCase = new PreviewProductionUseCase(database)
  })

  it('reports shortages without changing stock', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 2 },
    })
    expect(result.canProduce).toBe(false)
    expect(result.consumptions[0]?.missingQuantity).toBe(2)
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
  })
})
