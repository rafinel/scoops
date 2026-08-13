import {
  RegistrationAttemptType,
  type RegistrationAttemptType as RegistrationAttemptTypeValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const registrationAttemptTypeModel = pgEnum(
  'registration_attempt_type',
  Object.values(RegistrationAttemptType) as [
    RegistrationAttemptTypeValue,
    ...RegistrationAttemptTypeValue[],
  ],
)
