import type { AnalyticsStockFact } from '#analytics/domain/structures/analytics-stock-fact.ts'

export type StockAttention = {
  readonly updatedAt: Date
  readonly items: readonly AnalyticsStockFact[]
}
