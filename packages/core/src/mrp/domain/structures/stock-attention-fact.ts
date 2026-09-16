export type StockAttentionFact = {
  readonly establishmentId: string
  readonly productId: string
  readonly productName: string
  readonly kind: 'zero-stock' | 'below-ideal' | 'limited-production'
  readonly severity: number
  readonly availableQuantity: number
  readonly idealQuantity?: number
  readonly maximumProducibleQuantity?: number
  readonly destination: 'stock' | 'recipe'
}
