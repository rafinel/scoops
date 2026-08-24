import type { Recipe } from '#mrp/domain/entities/recipe.ts'
import type { RecipeCreate } from '#mrp/domain/structures/recipe-create.ts'
import type { RecipeUpdate } from '#mrp/domain/structures/recipe-update.ts'

export interface RecipesRepository {
  add(input: RecipeCreate): Promise<Recipe>
  findById(establishmentId: string, recipeId: string): Promise<Recipe | undefined>
  findByProductId(establishmentId: string, productId: string): Promise<Recipe | undefined>
  replace(
    establishmentId: string,
    recipeId: string,
    changes: RecipeUpdate,
  ): Promise<Recipe>
  remove(establishmentId: string, recipeId: string): Promise<void>
  removeAll(): Promise<void>
}
