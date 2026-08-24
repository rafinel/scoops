import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { productBrandModel } from '@/mrp/database/drizzle/models/product-brand-model'
import { productModel } from '@/mrp/database/drizzle/models/product-model'

export const resaleConfigurationModel = pgTable(
  'mrp_resale_configurations',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productModel.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id').references(() => productBrandModel.id, {
      onDelete: 'cascade',
    }),
    price: numeric('price', { precision: 18, scale: 2 }).notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('mrp_resale_configurations_establishment_product_idx').on(
      table.establishmentId,
      table.productId,
    ),
    uniqueIndex('mrp_resale_configurations_single_unique')
      .on(table.establishmentId, table.productId)
      .where(sql`${table.brandId} is null`),
    uniqueIndex('mrp_resale_configurations_brand_unique')
      .on(table.establishmentId, table.productId, table.brandId)
      .where(sql`${table.brandId} is not null`),
    check('mrp_resale_configurations_price_non_negative', sql`${table.price} >= 0`),
  ],
)
