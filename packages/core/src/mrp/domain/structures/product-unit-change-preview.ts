import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type ProductUnitChangePreview = {
  currentUnit: ProductUnit
  targetUnit: ProductUnit
  affected: {
    balances: number
    brands: readonly { brandId: string; brandName: string }[]
    recipeYields: number
    recipeIngredients: number
    sizes: number
    accompanimentLinks: number
    hasIdealStock: boolean
    hasCurrentUnitCost: boolean
  }
}
