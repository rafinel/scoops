import { AnalyticsProductResponseDto } from './analytics-product-response.dto'

export class AnalyticsProductsResponseDto {
  byNetSales!: AnalyticsProductResponseDto[]
  byQuantity!: AnalyticsProductResponseDto[]
}
