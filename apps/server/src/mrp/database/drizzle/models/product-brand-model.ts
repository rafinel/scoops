import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { productModel } from './product-model'

export const productBrandModel = pgTable(
  'mrp_product_brands',
  {
    id: uuid('id').primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    packageQuantity: numeric('package_quantity', { precision: 18, scale: 3 }).notNull(),
    packageValue: numeric('package_value', { precision: 18, scale: 3 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('mrp_product_brands_product_idx').on(table.productId),
    uniqueIndex('mrp_product_brands_product_name_unique').on(
      table.productId,
      sql`lower(${table.name})`,
    ),
    uniqueIndex('mrp_product_brands_one_primary_unique')
      .on(table.productId)
      .where(sql`${table.isPrimary} = true`),
    check(
      'mrp_product_brands_package_quantity_positive',
      sql`${table.packageQuantity} > 0`,
    ),
    check(
      'mrp_product_brands_package_value_non_negative',
      sql`${table.packageValue} >= 0`,
    ),
  ],
)
