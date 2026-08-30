import type { Entity } from '#shared/domain/entities/entity.ts'
import type { OrderDiscount } from '#pdv/domain/structures/order-discount.ts'
import type { OrderLine } from '#pdv/domain/structures/order-line.ts'
import type { OrderCancellation } from '#pdv/domain/structures/order-cancellation.ts'
import type { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type { SalesChannelSnapshot } from '#pdv/domain/structures/sales-channel-snapshot.ts'

export type Order = Entity & {
  establishmentId: string
  idempotencyKey: string
  sequenceNumber: number
  createdBy: string
  createdByName: string
  status: OrderStatus
  channel?: SalesChannelSnapshot
  lines: readonly OrderLine[]
  discounts: readonly OrderDiscount[]
  subtotal: number
  totalDiscount: number
  total: number
  cancellation?: OrderCancellation
  createdAt: Date
}

export type OrderCreate = Omit<
  Order,
  'id' | 'sequenceNumber' | 'status' | 'cancellation' | 'createdAt'
>
