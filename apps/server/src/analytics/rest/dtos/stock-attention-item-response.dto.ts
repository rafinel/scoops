export class StockAttentionItemResponseDto {
  productId!: string
  productName!: string
  kind!: 'zero-stock' | 'below-ideal' | 'limited-production'
  severity!: number
  availableQuantity!: number
  idealQuantity!: number | null
  maximumProducibleQuantity!: number | null
  destination!: 'stock' | 'recipe'
}
