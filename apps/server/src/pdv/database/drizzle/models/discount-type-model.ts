import type { DiscountType } from '@scoops/core/pdv/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const discountTypeModel = pgEnum('pdv_discount_type', ['combo'] as [
  DiscountType,
  ...DiscountType[],
])
