import type { InferSelectModel } from 'drizzle-orm'

import type { userRegistrationAttemptModel } from '@/identity/database/drizzle/models/user-registration-attempt-model'

export type DrizzleUserRegistrationAttempt = InferSelectModel<
  typeof userRegistrationAttemptModel
>
