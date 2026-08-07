import type { Entity } from '#shared/domain/entities/entity.ts'
import type { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export type Discount = Entity & {
  establishmentId: string
  name: string
  type: DiscountType
  status: DiscountStatus
  createdAt: Date
  updatedAt: Date
}
