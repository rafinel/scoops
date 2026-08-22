import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type RecipeIngredientDetails = {
  readonly id: string
  readonly ingredientProductId: string
  readonly ingredientProductName: string
  readonly ingredientBrandId?: string
  readonly ingredientBrandName?: string
  readonly unit: ProductUnit
  readonly quantity: number
  readonly unitCost: number
  readonly lineCost: number
  readonly cogsPercentage: number
  readonly currentBalance: number
  readonly capacity: number
  readonly isLimiting: boolean
}
