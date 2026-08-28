import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesChannelSnapshot } from '#pdv/domain/structures/sales-channel-snapshot.ts'

type PortionPreviewLine = {
  readonly productId: string
  readonly kind: Extract<SaleItemKind, 'portion'>
  readonly quantity: number
  readonly sizeId: string
  readonly accompanimentIds: readonly string[]
  readonly brandId?: never
}

type ResalePreviewLine = {
  readonly productId: string
  readonly kind: Extract<SaleItemKind, 'resale'>
  readonly quantity: number
  readonly brandId?: string
  readonly sizeId?: never
  readonly accompanimentIds?: readonly string[]
}

export interface OrderPreviewInput {
  readonly channelId?: string
  readonly lines: readonly (PortionPreviewLine | ResalePreviewLine)[]
}

export interface OrderPreviewFacts {
  readonly cart: Cart
  readonly channel?: SalesChannelSnapshot
}

export interface OrderPreview extends OrderPreviewFacts {
  readonly previewToken: string
}
