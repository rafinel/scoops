import type { RecipeIngredient } from '#mrp/domain/entities/recipe-ingredient.ts'

export type RecipeIngredientCreate = Omit<
  RecipeIngredient,
  'id' | 'createdAt' | 'updatedAt'
>
