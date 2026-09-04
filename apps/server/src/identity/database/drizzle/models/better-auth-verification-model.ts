import { sql } from 'drizzle-orm'
import { check, index, text, timestamp } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'

export const betterAuthVerificationModel = betterAuthSchema.table(
  'verification',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_verification_id_uuid_check',
      sql`${table.id} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`,
    ),
    index('better_auth_verification_identifier_idx').on(table.identifier),
  ],
)
