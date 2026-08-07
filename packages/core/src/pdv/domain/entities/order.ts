import type { Entity } from '#shared/domain/entities/entity.ts'
import type { OrderDiscount } from '#pdv/domain/structures/order-discount.ts'
import type { OrderLine } from '#pdv/domain/structures/order-line.ts'
import type { SalesChannelSnapshot } from '#pdv/domain/structures/sales-channel-snapshot.ts'

export type Order = Entity & {
  establishmentId: string
  idempotencyKey: string
  sequenceNumber: number
  createdBy: string
  channel?: SalesChannelSnapshot
  lines: readonly OrderLine[]
  discounts: readonly OrderDiscount[]
  subtotal: number
  totalDiscount: number
  total: number
  createdAt: Date
}

export type OrderCreate = Omit<Order, 'id' | 'sequenceNumber' | 'createdAt'>
