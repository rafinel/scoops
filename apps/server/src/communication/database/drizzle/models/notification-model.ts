import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { notificationKindModel } from '@/communication/database/drizzle/models/notification-kind-model'

export const notificationModel = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceEventId: text('source_event_id').notNull(),
    establishmentId: uuid('establishment_id').notNull(),
    recipientUserId: uuid('recipient_user_id').notNull(),
    kind: notificationKindModel('kind').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('communication_notifications_source_recipient_kind_unique').on(
      table.sourceEventId,
      table.recipientUserId,
      table.kind,
    ),
    index('communication_notifications_private_page_idx').on(
      table.establishmentId,
      table.recipientUserId,
      table.occurredAt.desc(),
      table.id.desc(),
    ),
    index('communication_notifications_private_unread_idx')
      .on(
        table.establishmentId,
        table.recipientUserId,
        table.occurredAt.desc(),
        table.id.desc(),
      )
      .where(sql`${table.readAt} is null`),
    check(
      'communication_notifications_source_event_non_blank',
      sql`char_length(btrim(${table.sourceEventId})) between 1 and 255`,
    ),
    check(
      'communication_notifications_title_non_blank',
      sql`char_length(btrim(${table.title})) between 1 and 120`,
    ),
    check(
      'communication_notifications_message_non_blank',
      sql`char_length(btrim(${table.message})) between 1 and 500`,
    ),
    check(
      'communication_notifications_read_after_create',
      sql`${table.readAt} is null or ${table.readAt} >= ${table.createdAt}`,
    ),
  ],
)
