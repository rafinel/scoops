export type ResaleDiscountComponent = {
  readonly kind: 'resale'
  readonly productId: string
  readonly quantity: number
  readonly brandId?: string
}
