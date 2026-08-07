import type { Entity } from '#shared/domain/entities/entity.ts'

export type RecipeIngredient = Entity & {
  recipeId: string
  ingredientProductId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export type RecipeIngredientCreate = Omit<
  RecipeIngredient,
  'id' | 'createdAt' | 'updatedAt'
>

export type RecipeIngredientUpdate = Partial<Pick<RecipeIngredient, 'quantity'>>
