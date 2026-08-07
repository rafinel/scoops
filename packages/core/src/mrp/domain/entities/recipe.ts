import type { Entity } from '#shared/domain/entities/entity.ts'

export type Recipe = Entity & {
  productId: string
  yieldQuantity: number
  createdAt: Date
  updatedAt: Date
}

export type RecipeCreate = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

export type RecipeUpdate = Partial<Pick<Recipe, 'yieldQuantity'>>
