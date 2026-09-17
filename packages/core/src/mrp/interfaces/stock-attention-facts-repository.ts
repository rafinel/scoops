import type { StockAttentionSourceFact } from '#mrp/domain/structures/stock-attention-source-fact.ts'

export interface StockAttentionFactsRepository {
  listBatch(input: {
    establishmentId: string
    cursor?: string
    limit: number
  }): Promise<{ items: readonly StockAttentionSourceFact[]; nextCursor?: string }>
}
