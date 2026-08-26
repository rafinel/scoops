import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { discountComponentKindModel } from '@/pdv/database/drizzle/models/discount-component-kind-model'
import { discountModel } from '@/pdv/database/drizzle/models/discount-model'

export const discountComponentModel = pgTable(
  'pdv_discount_components',
  {
    id: uuid('id').primaryKey(),
    discountId: uuid('discount_id')
      .notNull()
      .references(() => discountModel.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    kind: discountComponentKindModel('kind').notNull(),
    quantity: integer('quantity').notNull(),
    sizeId: uuid('size_id'),
    brandId: uuid('brand_id'),
    position: integer('position').notNull(),
  },
  (table) => [
    index('pdv_discount_components_discount_position_idx').on(
      table.discountId,
      table.position,
    ),
    index('pdv_discount_components_product_discount_idx').on(
      table.productId,
      table.discountId,
    ),
    uniqueIndex('pdv_discount_components_discount_product_unique').on(
      table.discountId,
      table.productId,
    ),
    check('pdv_discount_components_quantity_valid', sql`${table.quantity} > 0`),
    check('pdv_discount_components_position_valid', sql`${table.position} >= 0`),
    check(
      'pdv_discount_components_kind_fields_valid',
      sql`(${table.kind} = 'portion' and ${table.sizeId} is not null and ${table.brandId} is null) or (${table.kind} = 'resale' and ${table.sizeId} is null)`,
    ),
  ],
)
