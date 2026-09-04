import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { eventStatusModel } from '@/shared/database/drizzle/models/event-status-model'

export const eventModel = pgTable(
  'events',
  {
    id: uuid('id').primaryKey(),
    eventName: text('event_name').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status: eventStatusModel('status').default('pending').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    availableAt: timestamp('available_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    attempts: integer('attempts').default(0).notNull(),
    reservedBy: text('reserved_by'),
    reservationExpiresAt: timestamp('reservation_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastErrorCode: text('last_error_code'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('events_attempts_nonnegative_check', sql`${table.attempts} >= 0`),
    check(
      'events_reservation_consistency_check',
      sql`(
        (${table.status} = 'publishing' AND ${table.reservedBy} IS NOT NULL AND ${table.reservationExpiresAt} IS NOT NULL)
        OR
        (${table.status} <> 'publishing' AND ${table.reservedBy} IS NULL AND ${table.reservationExpiresAt} IS NULL)
      )`,
    ),
    index('events_pending_available_idx')
      .on(table.availableAt, table.createdAt)
      .where(sql`${table.status} = 'pending'`),
    index('events_failed_available_idx')
      .on(table.availableAt, table.attempts)
      .where(sql`${table.status} = 'failed' AND ${table.attempts} < 10`),
    index('events_reservation_expiry_idx')
      .on(table.reservationExpiresAt)
      .where(sql`${table.status} = 'publishing'`),
    index('events_published_at_idx').on(table.publishedAt),
  ],
)

export type EventRecord = typeof eventModel.$inferSelect
