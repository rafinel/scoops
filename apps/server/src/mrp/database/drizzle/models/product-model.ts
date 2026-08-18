import { sql } from 'drizzle-orm'
import {
  index,
  check,
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const productUnitModel = pgEnum('mrp_product_unit', ['g', 'ml', 'kg', 'l', 'un'])
export const productCategoryModel = pgEnum('mrp_product_category', [
  'ingredient',
  'manufacturable',
  'portion',
  'accompaniment',
  'resale',
])
export const productStockControlModel = pgEnum('mrp_product_stock_control', [
  'single',
  'by-brand',
])
export const productStatusModel = pgEnum('mrp_product_status', ['active', 'inactive'])

export const productModel = pgTable(
  'mrp_products',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    name: text('name').notNull(),
    unit: productUnitModel('unit').notNull(),
    categories: productCategoryModel('categories').array().notNull(),
    stockControl: productStockControlModel('stock_control').notNull(),
    status: productStatusModel('status').notNull().default('active'),
    allowNegativeStock: boolean('allow_negative_stock').notNull().default(false),
    idealStock: numeric('ideal_stock', { precision: 18, scale: 3 }),
    internalNotes: text('internal_notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_products_establishment_name_unique').on(
      table.establishmentId,
      sql`lower(${table.name})`,
    ),
    index('mrp_products_establishment_status_idx').on(
      table.establishmentId,
      table.status,
    ),
    index('mrp_products_establishment_name_idx').on(table.establishmentId, table.name),
    check('mrp_products_categories_not_empty', sql`cardinality(${table.categories}) > 0`),
    check(
      'mrp_products_categories_compatible',
      sql`not ('portion' = any(${table.categories}) and 'resale' = any(${table.categories}))`,
    ),
    check(
      'mrp_products_manufacturable_single',
      sql`not ('manufacturable' = any(${table.categories})) or ${table.stockControl} = 'single'`,
    ),
    check(
      'mrp_products_ideal_stock_non_negative',
      sql`${table.idealStock} is null or ${table.idealStock} >= 0`,
    ),
  ],
)
