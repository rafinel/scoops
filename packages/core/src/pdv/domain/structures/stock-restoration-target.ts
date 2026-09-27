export type StockRestorationTarget = {
  readonly linePosition: number
  readonly productId: string
  readonly productName: string
  readonly brandId?: string
  readonly brandName?: string
  readonly quantity: number
}
