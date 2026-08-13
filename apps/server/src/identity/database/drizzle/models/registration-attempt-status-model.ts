import {
  RegistrationAttemptStatus,
  type RegistrationAttemptStatus as RegistrationAttemptStatusValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const registrationAttemptStatusModel = pgEnum(
  'registration_attempt_status',
  Object.values(RegistrationAttemptStatus) as [
    RegistrationAttemptStatusValue,
    ...RegistrationAttemptStatusValue[],
  ],
)
