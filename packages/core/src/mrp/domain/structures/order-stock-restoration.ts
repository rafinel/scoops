export type OrderStockRestoration = {
  readonly productId: string
  readonly productName: string
  readonly brandId?: string
  readonly brandName?: string
  readonly quantity: number
  readonly outcome: 'restored' | 'skipped'
}
