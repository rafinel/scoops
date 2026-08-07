import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'

export type CartLineInput = {
  readonly productId: string
  readonly kind: SaleItemKind
  readonly quantity: number
  readonly sizeId?: string
  readonly brandId?: string
  readonly accompanimentIds: readonly string[]
}
