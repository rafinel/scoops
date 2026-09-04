import { sql } from 'drizzle-orm'
import { check, index, integer, text, timestamp } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'

export const betterAuthMessageQuotaModel = betterAuthSchema.table(
  'message_quota',
  {
    identifierHash: text('identifier_hash').primaryKey(),
    windowStartedAt: timestamp('window_started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    sentCount: integer('sent_count').default(0).notNull(),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true, mode: 'date' }),
    lastKind: text('last_kind').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_message_quota_identifier_hash_check',
      sql`${table.identifierHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      'better_auth_message_quota_sent_count_check',
      sql`${table.sentCount} between 0 and 3`,
    ),
    check(
      'better_auth_message_quota_last_kind_check',
      sql`${table.lastKind} in ('verification', 'recovery', 'invitation')`,
    ),
    index('better_auth_message_quota_window_idx').on(table.windowStartedAt),
  ],
)
