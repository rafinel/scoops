import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core'

import { orderLineModel } from '@/pdv/database/drizzle/models/order-line-model'

export const orderLineAccompanimentModel = pgTable(
  'pdv_order_line_accompaniments',
  {
    orderLineId: uuid('order_line_id')
      .notNull()
      .references(() => orderLineModel.id, { onDelete: 'cascade' }),
    accompanimentId: uuid('accompaniment_id').notNull(),
    position: integer('position').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    basePrice: numeric('base_price', { precision: 18, scale: 2 }).notNull(),
    finalPrice: numeric('final_price', { precision: 18, scale: 2 }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.orderLineId, table.position],
      name: 'pdv_order_line_accompaniments_pkey',
    }),
    index('pdv_order_line_accompaniments_line_idx').on(table.orderLineId, table.position),
    check(
      'pdv_order_line_accompaniments_position_non_negative',
      sql`${table.position} >= 0`,
    ),
    check('pdv_order_line_accompaniments_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'pdv_order_line_accompaniments_base_price_non_negative',
      sql`${table.basePrice} >= 0`,
    ),
    check(
      'pdv_order_line_accompaniments_final_price_non_negative',
      sql`${table.finalPrice} >= 0`,
    ),
  ],
)
