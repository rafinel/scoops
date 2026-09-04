import { sql } from 'drizzle-orm'
import { check, index, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'
import { betterAuthUserModel } from '@/identity/database/drizzle/models/better-auth-user-model'

export const betterAuthSessionModel = betterAuthSchema.table(
  'session',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    token: text('token').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => betterAuthUserModel.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_session_id_uuid_check',
      sql`${table.id} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`,
    ),
    uniqueIndex('better_auth_session_token_unique').on(table.token),
    index('better_auth_session_user_id_idx').on(table.userId),
  ],
)
