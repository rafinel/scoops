import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'

export type StockAttentionSourceFact = {
  readonly establishmentId: string
  readonly productId: string
  readonly productName: string
  readonly categories: readonly ProductCategory[]
  readonly availableQuantity: number
  readonly idealQuantity: number | null
  readonly recipe: {
    readonly yieldQuantity: number
    readonly ingredients: readonly {
      readonly requiredQuantity: number
      readonly availableQuantity: number
    }[]
  } | null
}
