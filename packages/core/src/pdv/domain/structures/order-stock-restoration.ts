export type OrderStockRestoration = {
  /** Missing only for restoration facts written before line attribution existed. */
  readonly linePosition?: number
  readonly productId: string
  readonly productName: string
  readonly brandId?: string
  readonly brandName?: string
  readonly quantity: number
  readonly outcome: 'restored' | 'skipped' | 'lost'
}
