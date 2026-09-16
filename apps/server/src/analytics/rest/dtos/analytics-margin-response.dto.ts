import { AnalyticsAffectedProductResponseDto } from './analytics-affected-product-response.dto'

export class AnalyticsMarginResponseDto {
  coveredNetSalesCents!: number
  cogsCents!: number
  grossMarginCents!: number | null
  grossMarginPercentage!: number | null
  coveragePercentage!: number
  uncoveredNetSalesCents!: number
  affectedProducts!: AnalyticsAffectedProductResponseDto[]
}
