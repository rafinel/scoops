import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { orderDiscountComponentModel } from '@/pdv/database/drizzle/models/order-discount-component-model'

export const orderDiscountComponentAccompanimentModel = pgTable(
  'pdv_order_discount_component_accompaniments',
  {
    componentId: uuid('component_id')
      .notNull()
      .references(() => orderDiscountComponentModel.id, { onDelete: 'cascade' }),
    accompanimentId: uuid('accompaniment_id').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.componentId, table.position],
      name: 'pdv_order_discount_component_accompaniments_pkey',
    }),
    index('pdv_order_discount_component_accompaniments_component_idx').on(
      table.componentId,
      table.position,
    ),
    check(
      'pdv_order_discount_component_accompaniments_position_non_negative',
      sql`${table.position} >= 0`,
    ),
  ],
)
