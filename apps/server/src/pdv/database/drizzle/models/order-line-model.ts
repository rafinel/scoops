import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { discountComponentKindModel } from '@/pdv/database/drizzle/models/discount-component-kind-model'
import { orderModel } from '@/pdv/database/drizzle/models/order-model'

export const orderLineModel = pgTable(
  'pdv_order_lines',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orderModel.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    productId: uuid('product_id').notNull(),
    productName: text('product_name').notNull(),
    kind: discountComponentKindModel('kind').notNull(),
    brandId: uuid('brand_id'),
    brandName: text('brand_name'),
    sizeId: uuid('size_id'),
    sizeName: text('size_name'),
    sizeQuantity: numeric('size_quantity', { precision: 18, scale: 3 }),
    quantity: integer('quantity').notNull(),
    baseUnitPrice: numeric('base_unit_price', { precision: 18, scale: 2 }).notNull(),
    finalUnitPrice: numeric('final_unit_price', { precision: 18, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
  },
  (table) => [
    index('pdv_order_lines_order_position_idx').on(table.orderId, table.position),
    uniqueIndex('pdv_order_lines_order_position_unique').on(
      table.orderId,
      table.position,
    ),
    check('pdv_order_lines_position_non_negative', sql`${table.position} >= 0`),
    check('pdv_order_lines_quantity_positive', sql`${table.quantity} > 0`),
    check('pdv_order_lines_base_price_non_negative', sql`${table.baseUnitPrice} >= 0`),
    check('pdv_order_lines_final_price_non_negative', sql`${table.finalUnitPrice} >= 0`),
    check('pdv_order_lines_subtotal_non_negative', sql`${table.subtotal} >= 0`),
    check(
      'pdv_order_lines_kind_fields_valid',
      sql`(${table.kind} = 'portion' and ${table.sizeId} is not null and ${table.sizeName} is not null and ${table.sizeQuantity} is not null and ${table.brandId} is null and ${table.brandName} is null) or (${table.kind} = 'resale' and ${table.sizeId} is null and ${table.sizeName} is null and ${table.sizeQuantity} is null and ((${table.brandId} is null and ${table.brandName} is null) or (${table.brandId} is not null and ${table.brandName} is not null)))`,
    ),
    check(
      'pdv_order_lines_size_quantity_positive',
      sql`${table.sizeQuantity} is null or ${table.sizeQuantity} > 0`,
    ),
  ],
)
