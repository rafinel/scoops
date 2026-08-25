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
import { accompanimentTypeModel } from './accompaniment-type-model'

export const productAccompanimentModel = pgTable(
  'mrp_product_accompaniments',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    accompanimentProductId: uuid('accompaniment_product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'restrict' }),
    accompanimentTypeId: uuid('accompaniment_type_id')
      .notNull()
      .references(() => accompanimentTypeModel.id, { onDelete: 'restrict' }),
    quantityPerPortion: numeric('quantity_per_portion', {
      precision: 18,
      scale: 3,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_product_accompaniments_product_target_unique').on(
      table.establishmentId,
      table.productId,
      table.accompanimentProductId,
    ),
    index('mrp_product_accompaniments_establishment_product_idx').on(
      table.establishmentId,
      table.productId,
    ),
    index('mrp_product_accompaniments_establishment_accompaniment_idx').on(
      table.establishmentId,
      table.accompanimentProductId,
    ),
    index('mrp_product_accompaniments_establishment_type_idx').on(
      table.establishmentId,
      table.accompanimentTypeId,
    ),
    check(
      'mrp_product_accompaniments_distinct_products',
      sql`${table.productId} <> ${table.accompanimentProductId}`,
    ),
    check(
      'mrp_product_accompaniments_quantity_positive',
      sql`${table.quantityPerPortion} > 0`,
    ),
  ],
)
