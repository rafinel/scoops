export type StockConsumption = {
  readonly productId: string
  /** Historical target label captured when the consumed product is indirect. */
  readonly productName?: string
  readonly accompanimentId?: string
  readonly brandId?: string
  /** Historical target label captured when the consumed brand is indirect. */
  readonly brandName?: string
  readonly quantity: number
}
