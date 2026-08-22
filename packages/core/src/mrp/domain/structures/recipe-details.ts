import type { RecipeIngredientDetails } from '#mrp/domain/structures/recipe-ingredient-details.ts'

export type RecipeDetails = {
  readonly id: string
  readonly yieldQuantity: number
  readonly totalCost: number
  readonly unitCost: number
  readonly maximumProducibleQuantity: number
  readonly ingredients: readonly RecipeIngredientDetails[]
}
