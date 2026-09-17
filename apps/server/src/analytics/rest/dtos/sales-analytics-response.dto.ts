import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { AnalyticsIntervalResponseDto } from './analytics-interval-response.dto'

export class SalesAnalyticsResponseDto {
  period!: SalesAnalytics['period']
  selected!: AnalyticsIntervalResponseDto
  comparison!: AnalyticsIntervalResponseDto
  updatedAt!: Date
  summary!: SalesAnalytics['summary']
  margin!: SalesAnalytics['margin']
  cancellations!: SalesAnalytics['cancellations']
  evolution!: SalesAnalytics['evolution']
  products!: SalesAnalytics['products']
  channels!: SalesAnalytics['channels']

  static from(value: SalesAnalytics): SalesAnalyticsResponseDto {
    return Object.assign(new SalesAnalyticsResponseDto(), value, {
      selected: AnalyticsIntervalResponseDto.from(value.selected),
      comparison: AnalyticsIntervalResponseDto.from(value.comparison),
    })
  }
}
