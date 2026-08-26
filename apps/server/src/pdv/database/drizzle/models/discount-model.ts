import { sql } from 'drizzle-orm'
import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { discountStatusModel } from '@/pdv/database/drizzle/models/discount-status-model'
import { discountTypeModel } from '@/pdv/database/drizzle/models/discount-type-model'

export const discountModel = pgTable(
  'pdv_discounts',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    name: text('name').notNull(),
    type: discountTypeModel('type').notNull(),
    status: discountStatusModel('status').notNull(),
    fixedPrice: numeric('fixed_price', { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('pdv_discounts_establishment_name_unique').on(
      table.establishmentId,
      sql`lower(btrim(${table.name}))`,
    ),
    index('pdv_discounts_establishment_status_type_name_idx').on(
      table.establishmentId,
      table.status,
      table.type,
      sql`lower(btrim(${table.name}))`,
      table.id,
    ),
    check(
      'pdv_discounts_name_valid',
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
    check('pdv_discounts_fixed_price_valid', sql`${table.fixedPrice} > 0`),
  ],
)
