import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  numeric,
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
    packageQuantity: numeric('package_quantity', { precision: 18, scale: 3 }),
    packageValue: numeric('package_value', { precision: 18, scale: 3 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [index('mrp_product_brands_product_idx').on(table.productId)],
)
