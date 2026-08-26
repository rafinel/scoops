import type { DiscountStatus } from '@scoops/core/pdv/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const discountStatusModel = pgEnum('pdv_discount_status', [
  'active',
  'inactive',
] as [DiscountStatus, ...DiscountStatus[]])
