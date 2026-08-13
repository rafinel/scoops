import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import { registrationAttemptStatusModel } from '@/identity/database/drizzle/models/registration-attempt-status-model'
import { registrationAttemptTypeModel } from '@/identity/database/drizzle/models/registration-attempt-type-model'
import { userProfileModel } from '@/identity/database/drizzle/models/user-profile-model'

export const userRegistrationAttemptModel = pgTable('user_registration_attempts', {
  id: uuid('id').primaryKey(),
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishmentModel.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  profile: userProfileModel('profile').notNull(),
  type: registrationAttemptTypeModel('type').notNull(),
  status: registrationAttemptStatusModel('status').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
})
