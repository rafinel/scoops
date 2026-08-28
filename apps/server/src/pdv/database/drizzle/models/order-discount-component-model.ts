import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { discountComponentKindModel } from '@/pdv/database/drizzle/models/discount-component-kind-model'
import { orderDiscountModel } from '@/pdv/database/drizzle/models/order-discount-model'

export const orderDiscountComponentModel = pgTable(
  'pdv_order_discount_components',
  {
    id: uuid('id').primaryKey(),
    orderDiscountId: uuid('order_discount_id')
      .notNull()
      .references(() => orderDiscountModel.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    kind: discountComponentKindModel('kind').notNull(),
    quantity: integer('quantity').notNull(),
    sizeId: uuid('size_id'),
    brandId: uuid('brand_id'),
    unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    index('pdv_order_discount_components_discount_position_idx').on(
      table.orderDiscountId,
      table.position,
    ),
    uniqueIndex('pdv_order_discount_components_discount_position_unique').on(
      table.orderDiscountId,
      table.position,
    ),
    check('pdv_order_discount_components_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'pdv_order_discount_components_position_non_negative',
      sql`${table.position} >= 0`,
    ),
    check(
      'pdv_order_discount_components_unit_price_non_negative',
      sql`${table.unitPrice} >= 0`,
    ),
    check(
      'pdv_order_discount_components_subtotal_non_negative',
      sql`${table.subtotal} >= 0`,
    ),
    check(
      'pdv_order_discount_components_kind_fields_valid',
      sql`(${table.kind} = 'portion' and ${table.sizeId} is not null and ${table.brandId} is null) or (${table.kind} = 'resale' and ${table.sizeId} is null)`,
    ),
  ],
)
