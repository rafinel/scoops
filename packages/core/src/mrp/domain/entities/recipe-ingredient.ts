import type { Entity } from '#shared/domain/entities/entity.ts'

export type RecipeIngredient = Entity & {
  establishmentId: string
  recipeId: string
  ingredientProductId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
}
