import { sql } from 'drizzle-orm'
import {
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { productModel } from './product-model'

export const recipeModel = pgTable(
  'mrp_recipes',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    yieldQuantity: numeric('yield_quantity', { precision: 18, scale: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_recipes_establishment_product_unique').on(
      table.establishmentId,
      table.productId,
    ),
    index('mrp_recipes_establishment_product_idx').on(
      table.establishmentId,
      table.productId,
    ),
    check('mrp_recipes_yield_positive', sql`${table.yieldQuantity} > 0`),
  ],
)
