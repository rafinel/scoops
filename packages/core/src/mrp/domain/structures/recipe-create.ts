import type { Recipe } from '#mrp/domain/entities/recipe.ts'

export type RecipeCreate = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
