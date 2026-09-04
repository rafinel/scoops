import { sql } from 'drizzle-orm'
import { check, index, integer, text, timestamp } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'

export const betterAuthSignInAttemptModel = betterAuthSchema.table(
  'sign_in_attempt',
  {
    identifierHash: text('identifier_hash').primaryKey(),
    failedAttempts: integer('failed_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until', { withTimezone: true, mode: 'date' }),
    lastFailedAt: timestamp('last_failed_at', { withTimezone: true, mode: 'date' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_sign_in_attempt_identifier_hash_check',
      sql`${table.identifierHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      'better_auth_sign_in_attempt_failed_attempts_check',
      sql`${table.failedAttempts} between 0 and 5`,
    ),
    index('better_auth_sign_in_attempt_locked_until_idx')
      .on(table.lockedUntil)
      .where(sql`${table.lockedUntil} is not null`),
  ],
)
