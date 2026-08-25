import type { RecipeIngredient } from '#mrp/domain/entities/recipe-ingredient.ts'
import type { RecipeIngredientCreate } from '#mrp/domain/structures/recipe-ingredient-create.ts'
import type { RecipeIngredientUpdate } from '#mrp/domain/structures/recipe-ingredient-update.ts'

export interface RecipeIngredientsRepository {
  add(input: RecipeIngredientCreate): Promise<RecipeIngredient>
  findById(
    establishmentId: string,
    recipeId: string,
    lineId: string,
  ): Promise<RecipeIngredient | undefined>
  findByRecipeId(
    establishmentId: string,
    recipeId: string,
  ): Promise<readonly RecipeIngredient[]>
  findByRecipeAndProduct(
    establishmentId: string,
    recipeId: string,
    productId: string,
  ): Promise<RecipeIngredient | undefined>
  findManyByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<readonly RecipeIngredient[]>
  countByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<number>
  replaceQuantitiesByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
    quantities: readonly { lineId: string; quantity: number }[],
  ): Promise<void>
  removeByIngredientProductId(
    establishmentId: string,
    ingredientProductId: string,
  ): Promise<void>
  replace(
    establishmentId: string,
    recipeId: string,
    lineId: string,
    changes: RecipeIngredientUpdate,
  ): Promise<RecipeIngredient>
  remove(establishmentId: string, recipeId: string, lineId: string): Promise<void>
  removeAll(): Promise<void>
}
