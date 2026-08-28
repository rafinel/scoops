import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { orderDiscountComponentModel } from '@/pdv/database/drizzle/models/order-discount-component-model'
import { orderLineModel } from '@/pdv/database/drizzle/models/order-line-model'

export const orderDiscountLineModel = pgTable(
  'pdv_order_discount_lines',
  {
    componentId: uuid('component_id')
      .notNull()
      .references(() => orderDiscountComponentModel.id, { onDelete: 'cascade' }),
    orderLineId: uuid('order_line_id')
      .notNull()
      .references(() => orderLineModel.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.componentId, table.orderLineId],
      name: 'pdv_order_discount_lines_pkey',
    }),
  ],
)
