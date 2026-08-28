export type SalesCatalogAccompaniment = {
  readonly accompanimentId: string
  readonly productId?: string
  readonly brandId?: string
  readonly name: string
  readonly type: string
  readonly quantityPerPortion: number
  readonly basePrice: number
  readonly isActive: boolean
  readonly isAvailable: boolean
  readonly availableQuantity?: number
}
