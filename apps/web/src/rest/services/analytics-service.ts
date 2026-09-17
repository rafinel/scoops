import type {
  AnalyticsPeriod,
  SalesAnalytics,
  StockAttention,
} from '@scoops/core/analytics/domain/structures'
import type { AnalyticsService as CoreAnalyticsService } from '@scoops/core/analytics/interfaces'
import type { RestClient } from '@scoops/core/shared/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import {
  salesAnalyticsMapper,
  type SalesAnalyticsJson,
  stockAttentionMapper,
  type StockAttentionJson,
} from '@/rest/mappers/analytics'

export const AnalyticsService = (restClient: RestClient): CoreAnalyticsService => ({
  async getSales(period: AnalyticsPeriod) {
    const response = await restClient.get<SalesAnalyticsJson>(
      `/analytics/sales?period=${encodeURIComponent(period)}`,
    )
    if (!response.isSuccessful) return response as unknown as RestResponse<SalesAnalytics>
    return new RestResponse({
      body: salesAnalyticsMapper(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },
  async getStockAttention() {
    const response = await restClient.get<StockAttentionJson>(
      '/analytics/stock-attention',
    )
    if (!response.isSuccessful) return response as unknown as RestResponse<StockAttention>
    return new RestResponse({
      body: stockAttentionMapper(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },
})
