import type { AnalyticsInterval } from '@scoops/core/analytics/domain/structures'

export class AnalyticsIntervalResponseDto implements AnalyticsInterval {
  timeZone!: string
  localStartDate!: string
  localEndDate!: string
  startAt!: Date
  endAt!: Date

  static from(value: AnalyticsInterval): AnalyticsIntervalResponseDto {
    return Object.assign(new AnalyticsIntervalResponseDto(), value)
  }
}
