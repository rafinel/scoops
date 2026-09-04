import { sql } from 'drizzle-orm'
import { check, index, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'
import { betterAuthUserModel } from '@/identity/database/drizzle/models/better-auth-user-model'

export const betterAuthAccountModel = betterAuthSchema.table(
  'account',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => betterAuthUserModel.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_account_id_uuid_check',
      sql`${table.id} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`,
    ),
    uniqueIndex('better_auth_account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
    index('better_auth_account_user_id_idx').on(table.userId),
  ],
)
