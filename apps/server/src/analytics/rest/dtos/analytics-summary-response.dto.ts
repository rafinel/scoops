import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { AnalyticsComparisonResponseDto } from './analytics-comparison-response.dto'

export class AnalyticsSummaryResponseDto {
  netSalesCents!: number
  validOrders!: number
  averageTicketCents!: number | null
  comparison!: Record<
    keyof SalesAnalytics['summary']['comparison'],
    AnalyticsComparisonResponseDto
  >
}
