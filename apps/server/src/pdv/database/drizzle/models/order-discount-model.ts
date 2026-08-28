import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { discountTypeModel } from '@/pdv/database/drizzle/models/discount-type-model'
import { orderModel } from '@/pdv/database/drizzle/models/order-model'

export const orderDiscountModel = pgTable(
  'pdv_order_discounts',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orderModel.id, { onDelete: 'cascade' }),
    discountId: uuid('discount_id').notNull(),
    name: text('name').notNull(),
    type: discountTypeModel('type').notNull(),
    fixedPrice: numeric('fixed_price', { precision: 18, scale: 2 }).notNull(),
    preDiscountTotal: numeric('pre_discount_total', {
      precision: 18,
      scale: 2,
    }).notNull(),
    savings: numeric('savings', { precision: 18, scale: 2 }).notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    index('pdv_order_discounts_order_position_idx').on(table.orderId, table.position),
    uniqueIndex('pdv_order_discounts_order_discount_unique').on(
      table.orderId,
      table.discountId,
    ),
    check('pdv_order_discounts_fixed_price_positive', sql`${table.fixedPrice} > 0`),
    check(
      'pdv_order_discounts_pre_discount_total_non_negative',
      sql`${table.preDiscountTotal} >= 0`,
    ),
    check('pdv_order_discounts_savings_non_negative', sql`${table.savings} >= 0`),
    check('pdv_order_discounts_position_non_negative', sql`${table.position} >= 0`),
  ],
)
