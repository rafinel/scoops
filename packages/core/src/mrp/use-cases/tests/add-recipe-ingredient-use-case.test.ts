import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { ConflictError } from '#shared/domain/errors/index.ts'
import { AddRecipeIngredientUseCase } from '#mrp/use-cases/add-recipe-ingredient-use-case.ts'

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
const recipe = RecipeFaker.fake({
  id: 'recipe-1',
  establishmentId: product.establishmentId,
  productId: product.id,
  yieldQuantity: 2,
})

describe('Add Recipe Ingredient Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: AddRecipeIngredientUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredient,
    )
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findByRecipeAndProduct.mockResolvedValue(undefined)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])
    scope.stockBalancesRepository.findByProductId.mockResolvedValue({
      productId: ingredient.id,
      quantity: 10,
      situation: 'normal',
    })
    useCase = new AddRecipeIngredientUseCase(database)
  })

  it('adds an eligible, costed ingredient once', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { ingredientProductId: ingredient.id, quantity: 1 },
    })
    expect(scope.recipeIngredientsRepository.add).toHaveBeenCalledWith({
      establishmentId: product.establishmentId,
      recipeId: recipe.id,
      ingredientProductId: ingredient.id,
      quantity: 1,
    })
  })

  it('rejects duplicates without adding a line', async () => {
    scope.recipeIngredientsRepository.findByRecipeAndProduct.mockResolvedValue(
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
      }),
    )
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
        input: { ingredientProductId: ingredient.id, quantity: 1 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.recipeIngredientsRepository.add).not.toHaveBeenCalled()
  })
})
