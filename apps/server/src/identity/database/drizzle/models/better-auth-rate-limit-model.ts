import { sql } from 'drizzle-orm'
import { bigint, check, integer, text } from 'drizzle-orm/pg-core'

import { betterAuthSchema } from '@/identity/database/drizzle/models/better-auth-schema'

export const betterAuthRateLimitModel = betterAuthSchema.table(
  'rate_limit',
  {
    key: text('key').primaryKey(),
    count: integer('count').default(0).notNull(),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
  },
  (table) => [check('better_auth_rate_limit_count_check', sql`${table.count} >= 0`)],
)
