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

import { orderModel } from '@/pdv/database/drizzle/models/order-model'
import { orderStockRestorationOutcomeModel } from '@/pdv/database/drizzle/models/order-stock-restoration-outcome-model'

export const orderStockRestorationModel = pgTable(
  'pdv_order_stock_restorations',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orderModel.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    productId: uuid('product_id').notNull(),
    productName: text('product_name').notNull(),
    brandId: uuid('brand_id'),
    brandName: text('brand_name'),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    outcome: orderStockRestorationOutcomeModel('outcome').notNull(),
  },
  (table) => [
    uniqueIndex('pdv_order_stock_restorations_order_position_unique').on(
      table.orderId,
      table.position,
    ),
    index('pdv_order_stock_restorations_order_idx').on(table.orderId),
    check(
      'pdv_order_stock_restorations_position_non_negative',
      sql`${table.position} >= 0`,
    ),
    check(
      'pdv_order_stock_restorations_product_name_non_blank',
      sql`char_length(btrim(${table.productName})) > 0`,
    ),
    check('pdv_order_stock_restorations_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'pdv_order_stock_restorations_brand_snapshot_complete',
      sql`(${table.brandId} is null and ${table.brandName} is null) or (${table.brandId} is not null and ${table.brandName} is not null and length(btrim(${table.brandName})) > 0)`,
    ),
  ],
)
