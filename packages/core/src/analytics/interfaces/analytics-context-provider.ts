import type { AnalyticsAccessContext } from '#analytics/domain/structures/analytics-access-context.ts'
import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'

export interface AnalyticsContextProvider {
  resolve(actor: AnalyticsActor): Promise<AnalyticsAccessContext>
}
