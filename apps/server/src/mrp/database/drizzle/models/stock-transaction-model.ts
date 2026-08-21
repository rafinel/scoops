import { sql } from 'drizzle-orm'
import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { productModel } from './product-model'

export const stockTransactionModel = pgTable(
  'mrp_stock_transactions',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id'),
    productName: text('product_name').notNull(),
    brandName: text('brand_name'),
    unit: text('unit').notNull(),
    type: text('type').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 18, scale: 3 }).notNull(),
    performedBy: uuid('performed_by').notNull(),
    performedByName: text('performed_by_name').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('mrp_stock_transactions_product_page_idx').on(
      table.establishmentId,
      table.productId,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index('mrp_stock_transactions_brand_filter_idx').on(
      table.establishmentId,
      table.productId,
      table.brandId,
      table.occurredAt.desc(),
    ),
    check('mrp_stock_transactions_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'mrp_stock_transactions_unit_allowed',
      sql`${table.unit} in ('g', 'ml', 'kg', 'l', 'un')`,
    ),
    check(
      'mrp_stock_transactions_type_allowed',
      sql`${table.type} in ('entry', 'write-off')`,
    ),
  ],
)
