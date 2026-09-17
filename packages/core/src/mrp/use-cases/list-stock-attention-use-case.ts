import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { StockAttentionFact } from '#mrp/domain/structures/stock-attention-fact.ts'
import type { StockAttentionSourceFact } from '#mrp/domain/structures/stock-attention-source-fact.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'

export class ListStockAttentionUseCase {
  constructor(private readonly database: MrpDatabase) {}

  async execute(input: {
    establishmentId: string
  }): Promise<readonly StockAttentionFact[]> {
    return this.database.readSnapshot(async ({ stockAttentionFactsRepository }) => {
      if (!stockAttentionFactsRepository)
        throw new Error('O repositório de atenção de estoque não está disponível.')
      const result: StockAttentionFact[] = []
      let cursor: string | undefined
      do {
        const page = await stockAttentionFactsRepository.listBatch({
          establishmentId: input.establishmentId,
          ...(cursor ? { cursor } : {}),
          limit: 500,
        })
        for (const fact of page.items) {
          const classified = this.classify(fact)
          if (classified) result.push(classified)
        }
        cursor = page.nextCursor
      } while (cursor)
      return result.sort(compareAttention).slice(0, 5)
    })
  }

  private classify(source: StockAttentionSourceFact): StockAttentionFact | undefined {
    if (source.availableQuantity <= 0)
      return {
        establishmentId: source.establishmentId,
        productId: source.productId,
        productName: source.productName,
        kind: 'zero-stock',
        severity: Math.abs(source.availableQuantity),
        availableQuantity: source.availableQuantity,
        ...(source.idealQuantity === null ? {} : { idealQuantity: source.idealQuantity }),
        destination: 'stock',
      }
    if (source.idealQuantity !== null && source.availableQuantity < source.idealQuantity)
      return {
        establishmentId: source.establishmentId,
        productId: source.productId,
        productName: source.productName,
        kind: 'below-ideal',
        severity: source.idealQuantity - source.availableQuantity,
        availableQuantity: source.availableQuantity,
        idealQuantity: source.idealQuantity,
        destination: 'stock',
      }
    if (source.categories.includes(ProductCategory.Manufacturable) && source.recipe) {
      const maximum =
        source.recipe.ingredients.length === 0
          ? Number.POSITIVE_INFINITY
          : Math.min(
              ...source.recipe.ingredients.map(
                (ingredient) =>
                  ingredient.availableQuantity / ingredient.requiredQuantity,
              ),
            ) * source.recipe.yieldQuantity
      if (
        maximum <= 0 ||
        (source.idealQuantity !== null && maximum < source.idealQuantity)
      )
        return {
          establishmentId: source.establishmentId,
          productId: source.productId,
          productName: source.productName,
          kind: 'limited-production',
          severity: maximum === Number.POSITIVE_INFINITY ? 0 : Math.max(0, -maximum),
          availableQuantity: source.availableQuantity,
          maximumProducibleQuantity: Math.max(0, maximum),
          destination: 'recipe',
        }
    }
    return undefined
  }
}

function compareAttention(left: StockAttentionFact, right: StockAttentionFact): number {
  const rank = { 'zero-stock': 0, 'below-ideal': 1, 'limited-production': 2 } as const
  return (
    rank[left.kind] - rank[right.kind] ||
    right.severity - left.severity ||
    left.productId.localeCompare(right.productId)
  )
}
