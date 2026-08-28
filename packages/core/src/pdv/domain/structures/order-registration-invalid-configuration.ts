import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'

export type OrderRegistrationInvalidConfiguration = {
  readonly productId: string
  readonly productName: string
  readonly selectedKind: SaleItemKind
  readonly selectedId: string
  readonly reason: string
  readonly correctiveMessage: string
}
