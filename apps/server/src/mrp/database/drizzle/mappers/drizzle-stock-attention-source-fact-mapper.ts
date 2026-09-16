import type { StockAttentionSourceFact } from '@scoops/core/mrp/domain/structures'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

export class DrizzleStockAttentionSourceFactMapper {
  static toDomain(input: {
    establishmentId: string
    productId: string
    productName: string
    categories: readonly ProductCategory[]
    availableQuantity: number
    idealQuantity: number | null
    recipe?: StockAttentionSourceFact['recipe']
  }): StockAttentionSourceFact {
    return { ...input, recipe: input.recipe ?? null }
  }
}
