import { sql } from 'drizzle-orm'
import { check, index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core'

import { productionModel } from './production-model'

export const productionIngredientModel = pgTable(
  'mrp_production_ingredients',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productionId: uuid('production_id')
      .notNull()
      .references(() => productionModel.id, { onDelete: 'cascade' }),
    ingredientProductId: uuid('ingredient_product_id').notNull(),
    ingredientProductName: text('ingredient_product_name').notNull(),
    ingredientBrandId: uuid('ingredient_brand_id'),
    ingredientBrandName: text('ingredient_brand_name'),
    unit: text('unit').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 18, scale: 3 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
    lineCost: numeric('line_cost', { precision: 18, scale: 6 }).notNull(),
  },
  (table) => [
    index('mrp_production_ingredients_production_idx').on(
      table.establishmentId,
      table.productionId,
    ),
    check(
      'mrp_production_ingredients_values_valid',
      sql`${table.quantity} > 0 and ${table.unitCost} >= 0 and ${table.lineCost} >= 0`,
    ),
    check(
      'mrp_production_ingredients_brand_pair',
      sql`(${table.ingredientBrandId} is null and ${table.ingredientBrandName} is null) or (${table.ingredientBrandId} is not null and ${table.ingredientBrandName} is not null)`,
    ),
  ],
)
