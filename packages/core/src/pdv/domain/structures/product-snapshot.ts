import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'

export type ProductSnapshot = {
  readonly productId: string
  readonly name: string
  readonly kind: SaleItemKind
}
