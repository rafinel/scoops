import type { DiscountComponent } from '@scoops/core/pdv/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

type DiscountComponentKind = DiscountComponent['kind']

export const discountComponentKindModel = pgEnum('pdv_discount_component_kind', [
  'portion',
  'resale',
] as [DiscountComponentKind, ...DiscountComponentKind[]])
