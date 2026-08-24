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

import { productModel } from '@/mrp/database/drizzle/models/product-model'

export const productSizeModel = pgTable(
  'mrp_product_sizes',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    price: numeric('price', { precision: 18, scale: 2 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('mrp_product_sizes_establishment_product_idx').on(
      table.establishmentId,
      table.productId,
    ),
    uniqueIndex('mrp_product_sizes_product_name_unique').on(
      table.establishmentId,
      table.productId,
      sql`lower(${table.name})`,
    ),
    check('mrp_product_sizes_quantity_positive', sql`${table.quantity} > 0`),
    check('mrp_product_sizes_price_non_negative', sql`${table.price} >= 0`),
  ],
)
