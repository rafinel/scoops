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

import { salesChannelStatusModel } from '@/pdv/database/drizzle/models/sales-channel-status-model'

export const salesChannelModel = pgTable(
  'pdv_sales_channels',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    name: text('name').notNull(),
    percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
    status: salesChannelStatusModel('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('pdv_sales_channels_establishment_name_unique').on(
      table.establishmentId,
      sql`lower(btrim(${table.name}))`,
    ),
    index('pdv_sales_channels_establishment_status_name_idx').on(
      table.establishmentId,
      table.status,
      sql`lower(btrim(${table.name}))`,
      table.id,
    ),
    check(
      'pdv_sales_channels_name_valid',
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
    check(
      'pdv_sales_channels_percentage_valid',
      sql`${table.percentage} between -99.99 and 100.00`,
    ),
  ],
)
