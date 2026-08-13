import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import { userProfileModel } from '@/identity/database/drizzle/models/user-profile-model'
import { userStatusModel } from '@/identity/database/drizzle/models/user-status-model'

export const userModel = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishmentModel.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    profile: userProfileModel('profile').notNull(),
    status: userStatusModel('status').notNull(),
    lastAccessAt: timestamp('last_access_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('users_email_lower_unique_idx').on(sql`lower(${table.email})`),
    index('users_establishment_status_idx').on(table.establishmentId, table.status),
    index('users_establishment_profile_status_idx').on(
      table.establishmentId,
      table.profile,
      table.status,
    ),
  ],
)
