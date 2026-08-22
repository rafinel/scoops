import type { Recipe } from '#mrp/domain/entities/recipe.ts'

export type RecipeUpdate = Partial<Pick<Recipe, 'yieldQuantity'>>
