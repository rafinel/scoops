import { sql } from 'drizzle-orm'
import { check, index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { orderLineModel } from './order-line-model'

export const orderLineCostComponentModel = pgTable(
  'order_line_cost_components',
  {
    id: uuid('id').primaryKey(),
    orderLineId: uuid('order_line_id')
      .notNull()
      .references(() => orderLineModel.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    kind: text('kind').notNull(),
    productId: uuid('product_id').notNull(),
    brandId: uuid('brand_id'),
    accompanimentId: uuid('accompaniment_id'),
    quantity: numeric('quantity', { precision: 18, scale: 3 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }),
    extendedCostCents: integer('extended_cost_cents'),
  },
  (table) => [
    index('pdv_order_line_cost_components_line_position_idx').on(
      table.orderLineId,
      table.position,
    ),
    check('pdv_order_line_cost_components_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'pdv_order_line_cost_components_cost_pair',
      sql`(${table.unitCost} is null and ${table.extendedCostCents} is null) or (${table.unitCost} is not null and ${table.extendedCostCents} is not null and ${table.unitCost} >= 0 and ${table.extendedCostCents} >= 0)`,
    ),
  ],
)
