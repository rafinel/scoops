import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'

import { orderLineModel } from '@/pdv/database/drizzle/models/order-line-model'

export const orderLineConsumptionModel = pgTable(
  'pdv_order_line_consumptions',
  {
    orderLineId: uuid('order_line_id')
      .notNull()
      .references(() => orderLineModel.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    productId: uuid('product_id').notNull(),
    brandId: uuid('brand_id'),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.orderLineId, table.position],
      name: 'pdv_order_line_consumptions_pkey',
    }),
    index('pdv_order_line_consumptions_line_idx').on(table.orderLineId, table.position),
    check(
      'pdv_order_line_consumptions_position_non_negative',
      sql`${table.position} >= 0`,
    ),
    check('pdv_order_line_consumptions_quantity_positive', sql`${table.quantity} > 0`),
  ],
)
