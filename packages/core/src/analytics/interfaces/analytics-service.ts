import type { AnalyticsPeriod } from '#analytics/domain/structures/analytics-period.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { SalesAnalytics } from '#analytics/domain/structures/sales-analytics.ts'
import type { StockAttention } from '#analytics/domain/structures/stock-attention.ts'

export interface AnalyticsService {
  getSales(period: AnalyticsPeriod): Promise<RestResponse<SalesAnalytics>>
  getStockAttention(): Promise<RestResponse<StockAttention>>
}
