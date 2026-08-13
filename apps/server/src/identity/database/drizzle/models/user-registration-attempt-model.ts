import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import { registrationAttemptStatusModel } from '@/identity/database/drizzle/models/registration-attempt-status-model'
import { registrationAttemptTypeModel } from '@/identity/database/drizzle/models/registration-attempt-type-model'
import { userProfileModel } from '@/identity/database/drizzle/models/user-profile-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

export const userRegistrationAttemptModel = pgTable(
  'user_registration_attempts',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userModel.id, { onDelete: 'restrict' }),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishmentModel.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    profile: userProfileModel('profile').notNull(),
    type: registrationAttemptTypeModel('type').notNull(),
    status: registrationAttemptStatusModel('status').notNull(),
    tokenHash: text('token_hash').notNull(),
    confirmationTokenHash: text('confirmation_token_hash'),
    supersededProviderSubject: uuid('superseded_provider_subject'),
    cleanupClaimToken: uuid('cleanup_claim_token'),
    cleanupClaimedAt: timestamp('cleanup_claimed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('registration_attempts_user_unique_idx').on(table.userId),
    uniqueIndex('registration_attempts_token_hash_unique_idx').on(table.tokenHash),
    uniqueIndex('registration_attempts_confirmation_hash_unique_idx')
      .on(table.confirmationTokenHash)
      .where(sql`${table.confirmationTokenHash} is not null`),
    index('registration_attempts_status_expires_idx').on(table.status, table.expiresAt),
    index('registration_attempts_cleanup_idx')
      .on(table.cleanupClaimedAt, table.expiresAt)
      .where(
        sql`(${table.status} in ('pending', 'expired') or ${table.supersededProviderSubject} is not null)`,
      ),
  ],
)
