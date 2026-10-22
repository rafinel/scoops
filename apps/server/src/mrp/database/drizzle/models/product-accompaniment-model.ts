import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { productModel } from './product-model'
import { accompanimentTypeModel } from './accompaniment-type-model'
import { globalAccompanimentModel } from './global-accompaniment-model'

export const productAccompanimentModel = pgTable(
  'product_accompaniments',
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
    accompanimentPrice: numeric('accompaniment_price', { precision: 18, scale: 2 }),
    globalAccompanimentId: uuid('global_accompaniment_id'),
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
    index('mrp_product_accompaniments_establishment_global_idx').on(
      table.establishmentId,
      table.globalAccompanimentId,
    ),
    foreignKey({
      name: 'mrp_product_accompaniments_global_product_fk',
      columns: [table.globalAccompanimentId, table.accompanimentProductId],
      foreignColumns: [
        globalAccompanimentModel.id,
        globalAccompanimentModel.accompanimentProductId,
      ],
    }).onDelete('restrict'),
    ...createAccompanimentConstraints(table),
  ],
)

function createAccompanimentConstraints(table: {
  productId: AnyPgColumn
  accompanimentProductId: AnyPgColumn
  quantityPerPortion: AnyPgColumn
  accompanimentPrice: AnyPgColumn
  globalAccompanimentId: AnyPgColumn
}) {
  return [
    check(
      'mrp_product_accompaniments_distinct_products',
      sql`${table.productId} <> ${table.accompanimentProductId}`,
    ),
    check(
      'mrp_product_accompaniments_quantity_positive',
      sql`${table.quantityPerPortion} > 0`,
    ),
    check(
      'mrp_product_accompaniments_accompaniment_price_non_negative',
      sql`${table.accompanimentPrice} is null or ${table.accompanimentPrice} >= 0`,
    ),
    check(
      'mrp_product_accompaniments_global_row_has_no_price',
      sql`${table.globalAccompanimentId} is null or ${table.accompanimentPrice} is null`,
    ),
  ]
}
