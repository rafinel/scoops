import type { Entity } from '#shared/domain/entities/entity.ts'
import type { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'

export type UserRegistrationAttempt = Entity & {
  userId: string
  establishmentId: string
  name: string
  email: string
  profile: UserProfile
  type: RegistrationAttemptType
  status: RegistrationAttemptStatus
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  confirmationTokenHash?: string
  supersededProviderSubject?: string
  cleanupClaimToken?: string
  cleanupClaimedAt?: Date
}

export type UserRegistrationAttemptCreate = UserRegistrationAttempt

export type UserRegistrationAttemptUpdate = Partial<
  Pick<
    UserRegistrationAttempt,
    | 'userId'
    | 'email'
    | 'name'
    | 'profile'
    | 'status'
    | 'tokenHash'
    | 'expiresAt'
    | 'updatedAt'
    | 'confirmationTokenHash'
    | 'supersededProviderSubject'
    | 'cleanupClaimToken'
    | 'cleanupClaimedAt'
  >
>
