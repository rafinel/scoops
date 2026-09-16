export class AnalyticsChannelResponseDto {
  snapshotId!: string | null
  name!: string
  currentId!: string | null
  netSalesCents!: number
  sharePercentage!: number
  validOrders!: number
  averageTicketCents!: number
}
