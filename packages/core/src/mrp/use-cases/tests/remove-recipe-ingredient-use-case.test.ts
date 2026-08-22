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
import { RemoveRecipeIngredientUseCase } from '#mrp/use-cases/remove-recipe-ingredient-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})
const recipe = RecipeFaker.fake({
  id: 'recipe-1',
  establishmentId: product.establishmentId,
  productId: product.id,
  yieldQuantity: 2,
})
const line = RecipeIngredientFaker.fake({
  id: 'line-1',
  establishmentId: product.establishmentId,
  recipeId: recipe.id,
  ingredientProductId: 'ingredient-1',
})

describe('Remove Recipe Ingredient Use Case', () => {
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveRecipeIngredientUseCase

  beforeEach(() => {
    const database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findById.mockResolvedValue(line)
    useCase = new RemoveRecipeIngredientUseCase(database)
  })

  it('removes only the selected line and leaves its recipe intact', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      lineId: line.id,
    })
    expect(scope.recipeIngredientsRepository.remove).toHaveBeenCalledWith(
      product.establishmentId,
      recipe.id,
      line.id,
    )
    expect(scope.recipesRepository.remove).not.toHaveBeenCalled()
  })
})
