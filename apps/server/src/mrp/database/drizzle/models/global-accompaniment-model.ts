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

export const globalAccompanimentModel = pgTable(
  'global_accompaniments',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
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
    accompanimentPrice: numeric('accompaniment_price', { precision: 18, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_global_accompaniments_establishment_product_unique').on(
      table.establishmentId,
      table.accompanimentProductId,
    ),
    uniqueIndex('mrp_global_accompaniments_id_product_unique').on(
      table.id,
      table.accompanimentProductId,
    ),
    index('mrp_global_accompaniments_establishment_type_idx').on(
      table.establishmentId,
      table.accompanimentTypeId,
    ),
    check(
      'mrp_global_accompaniments_quantity_positive',
      sql`${table.quantityPerPortion} > 0`,
    ),
    check(
      'mrp_global_accompaniments_accompaniment_price_non_negative',
      sql`${table.accompanimentPrice} is null or ${table.accompanimentPrice} >= 0`,
    ),
  ],
)
