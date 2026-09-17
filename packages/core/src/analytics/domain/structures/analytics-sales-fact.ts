export type AnalyticsSalesFact = {
  readonly orderId: string
  readonly registeredAt: Date
  readonly status: 'registered' | 'canceled'
  readonly canceledAt: Date | null
  readonly totalCents: number
  readonly channel: {
    readonly snapshotId: string | null
    readonly name: string
    readonly currentId: string | null
  }
  readonly lines: readonly {
    readonly productSnapshotId: string
    readonly productName: string
    readonly currentProductId: string | null
    readonly quantity: number
    readonly allocatedNetSalesCents: number
    readonly cogsCents: number | null
  }[]
}
