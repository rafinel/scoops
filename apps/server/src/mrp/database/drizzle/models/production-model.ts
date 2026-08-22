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

export const productionModel = pgTable(
  'mrp_productions',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id').notNull(),
    productName: text('product_name').notNull(),
    unit: text('unit').notNull(),
    recipeYield: numeric('recipe_yield', { precision: 18, scale: 3 }).notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    totalCost: numeric('total_cost', { precision: 18, scale: 6 }).notNull(),
    performedBy: uuid('performed_by').notNull(),
    performedByName: text('performed_by_name').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('mrp_productions_establishment_product_time_idx').on(
      table.establishmentId,
      table.productId,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    check(
      'mrp_productions_positive_values',
      sql`${table.recipeYield} > 0 and ${table.quantity} > 0 and ${table.totalCost} >= 0`,
    ),
  ],
)
