import type { Recipe, RecipeCreate, RecipeUpdate } from '#mrp/domain/entities/recipe.ts'

export interface RecipesRepository {
  add(input: RecipeCreate): Promise<Recipe>
  findById(recipeId: string): Promise<Recipe | undefined>
  findByProductId(productId: string): Promise<Recipe | undefined>
  replace(recipeId: string, changes: RecipeUpdate): Promise<Recipe>
  remove(recipeId: string): Promise<void>
}
