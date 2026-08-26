import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { discountComponentModel } from '@/pdv/database/drizzle/models/discount-component-model'

export const discountComponentAccompanimentModel = pgTable(
  'pdv_discount_component_accompaniments',
  {
    componentId: uuid('component_id')
      .notNull()
      .references(() => discountComponentModel.id, { onDelete: 'cascade' }),
    accompanimentId: uuid('accompaniment_id').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.componentId, table.accompanimentId],
      name: 'pdv_discount_component_accompaniments_pkey',
    }),
    index('pdv_discount_component_accompaniments_link_idx').on(
      table.accompanimentId,
      table.componentId,
    ),
    uniqueIndex('pdv_discount_component_accompaniments_component_position_unique').on(
      table.componentId,
      table.position,
    ),
    check(
      'pdv_discount_component_accompaniments_position_valid',
      sql`${table.position} >= 0`,
    ),
  ],
)
