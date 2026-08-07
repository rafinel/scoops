import type { DiscountComponentKind } from '#pdv/domain/structures/discount-component-kind.ts'

export type DiscountComponent = {
  readonly productId: string
  readonly kind: DiscountComponentKind
  readonly quantity: number
  readonly sizeId?: string
  readonly brandId?: string
  readonly accompanimentIds: readonly string[]
}
