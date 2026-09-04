import { sql } from 'drizzle-orm'
import { boolean, check, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'

export const betterAuthUserModel = betterAuthSchema.table(
  'user',
  {
    id: text('id').default(sql`gen_random_uuid()::text`).primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'better_auth_user_id_uuid_check',
      sql`${table.id} ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`,
    ),
    uniqueIndex('better_auth_user_email_lower_unique_idx').on(sql`lower(${table.email})`),
  ],
)
