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
import { recipeModel } from './recipe-model'

export const recipeIngredientModel = pgTable(
  'mrp_recipe_ingredients',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipeModel.id, { onDelete: 'cascade' }),
    ingredientProductId: uuid('ingredient_product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_recipe_ingredients_recipe_product_unique').on(
      table.recipeId,
      table.ingredientProductId,
    ),
    index('mrp_recipe_ingredients_establishment_recipe_idx').on(
      table.establishmentId,
      table.recipeId,
    ),
    check('mrp_recipe_ingredients_quantity_positive', sql`${table.quantity} > 0`),
  ],
)
