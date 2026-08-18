import { sql } from 'drizzle-orm'
import {
  check,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { productBrandModel } from './product-brand-model'
import { productModel } from './product-model'

export const stockBalanceModel = pgTable(
  'mrp_stock_balances',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id').references(() => productBrandModel.id, {
      onDelete: 'cascade',
    }),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull().default('0'),
    idealQuantity: numeric('ideal_quantity', { precision: 18, scale: 3 }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_stock_balances_single_product_unique')
      .on(table.productId)
      .where(sql`${table.brandId} is null`),
    uniqueIndex('mrp_stock_balances_brand_unique').on(table.productId, table.brandId),
    check(
      'mrp_stock_balances_ideal_non_negative',
      sql`${table.idealQuantity} is null or ${table.idealQuantity} >= 0`,
    ),
  ],
)
