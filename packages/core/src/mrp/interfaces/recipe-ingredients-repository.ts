import type {
  RecipeIngredient,
  RecipeIngredientCreate,
  RecipeIngredientUpdate,
} from '#mrp/domain/entities/recipe-ingredient.ts'

export interface RecipeIngredientsRepository {
  add(input: RecipeIngredientCreate): Promise<RecipeIngredient>
  findById(ingredientId: string): Promise<RecipeIngredient | undefined>
  findByRecipeId(recipeId: string): Promise<readonly RecipeIngredient[]>
  findByRecipeAndProduct(
    recipeId: string,
    ingredientProductId: string,
  ): Promise<RecipeIngredient | undefined>
  replace(
    ingredientId: string,
    changes: RecipeIngredientUpdate,
  ): Promise<RecipeIngredient>
  remove(ingredientId: string): Promise<void>
}
