export type PortionDiscountComponent = {
  readonly kind: 'portion'
  readonly productId: string
  readonly quantity: number
  readonly sizeId: string
  readonly accompanimentIds: readonly string[]
}
