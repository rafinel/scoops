import type { AnalyticsStockFact } from '#analytics/domain/structures/analytics-stock-fact.ts'

export interface AnalyticsStockFactsProvider {
  list(establishmentId: string): Promise<readonly AnalyticsStockFact[]>
}
