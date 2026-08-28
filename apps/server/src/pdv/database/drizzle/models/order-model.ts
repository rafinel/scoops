import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const orderModel = pgTable(
  'pdv_orders',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    idempotencyKey: uuid('idempotency_key').notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    createdBy: uuid('created_by').notNull(),
    channelId: uuid('channel_id'),
    channelName: text('channel_name'),
    channelPercentage: numeric('channel_percentage', { precision: 5, scale: 2 }),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
    totalDiscount: numeric('total_discount', { precision: 18, scale: 2 }).notNull(),
    total: numeric('total', { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('pdv_orders_establishment_idempotency_unique').on(
      table.establishmentId,
      table.idempotencyKey,
    ),
    uniqueIndex('pdv_orders_establishment_sequence_unique').on(
      table.establishmentId,
      table.sequenceNumber,
    ),
    index('pdv_orders_establishment_created_page_idx').on(
      table.establishmentId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    check('pdv_orders_sequence_positive', sql`${table.sequenceNumber} > 0`),
    check('pdv_orders_subtotal_non_negative', sql`${table.subtotal} >= 0`),
    check('pdv_orders_total_discount_non_negative', sql`${table.totalDiscount} >= 0`),
    check('pdv_orders_total_non_negative', sql`${table.total} >= 0`),
    check(
      'pdv_orders_channel_snapshot_complete',
      sql`(${table.channelId} is null and ${table.channelName} is null and ${table.channelPercentage} is null) or (${table.channelId} is not null and ${table.channelName} is not null and ${table.channelPercentage} is not null)`,
    ),
    check(
      'pdv_orders_channel_percentage_valid',
      sql`${table.channelPercentage} is null or ${table.channelPercentage} between -99.99 and 100.00`,
    ),
  ],
)
