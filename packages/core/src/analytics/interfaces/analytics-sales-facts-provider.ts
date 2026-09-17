import type { AnalyticsInterval } from '#analytics/domain/structures/analytics-interval.ts'
import type { AnalyticsSalesFact } from '#analytics/domain/structures/analytics-sales-fact.ts'

export interface AnalyticsSalesFactsProvider {
  forEachBatch(
    input: {
      readonly establishmentId: string
      readonly selected: AnalyticsInterval
      readonly comparison: AnalyticsInterval
    },
    consume: (facts: readonly AnalyticsSalesFact[]) => Promise<void>,
  ): Promise<void>
}
