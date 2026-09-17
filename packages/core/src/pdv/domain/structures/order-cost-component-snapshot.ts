export type OrderCostComponentSnapshot = {
  readonly kind: 'portion-base' | 'resale-product' | 'resale-brand' | 'accompaniment'
  readonly productId: string
  readonly brandId?: string
  readonly accompanimentId?: string
  readonly quantity: number
  readonly unitCost: number | null
  readonly extendedCostCents: number | null
}
