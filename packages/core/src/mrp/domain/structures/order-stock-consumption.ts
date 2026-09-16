export type OrderStockConsumption = {
  readonly establishmentId: string
  readonly orderId: string
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
  readonly consumptions: readonly {
    readonly productId: string
    readonly productName?: string
    readonly accompanimentId?: string
    readonly brandId?: string
    readonly brandName?: string
    readonly quantity: number
  }[]
}
