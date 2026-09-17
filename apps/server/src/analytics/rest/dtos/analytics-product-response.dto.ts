export class AnalyticsProductResponseDto {
  productSnapshotId!: string
  name!: string
  currentProductId!: string | null
  netSalesCents!: number
  quantity!: number
  cogsCents!: number
  marginPercentage!: number | null
  coveragePercentage!: number
}
