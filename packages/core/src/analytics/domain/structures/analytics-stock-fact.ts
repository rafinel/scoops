export type AnalyticsStockFact = {
  readonly productId: string
  readonly productName: string
  readonly kind: 'zero-stock' | 'below-ideal' | 'limited-production'
  readonly severity: number
  readonly availableQuantity: number
  readonly idealQuantity: number | null
  readonly maximumProducibleQuantity: number | null
  readonly destination: 'stock' | 'recipe'
}
