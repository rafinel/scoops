export type OrderStockRestorationRequest = {
  readonly establishmentId: string
  readonly orderId: string
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
  readonly targets: readonly {
    readonly productId: string
    readonly productName: string
    readonly brandId?: string
    readonly brandName?: string
    readonly quantity: number
  }[]
}
