import type {
  UserRegistrationAttempt,
  UserRegistrationAttemptCreate,
  UserRegistrationAttemptUpdate,
} from '#identity/domain/entities/user-registration-attempt.ts'
import type { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'
import type { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'

export interface RegistrationAttemptsRepository {
  add(input: UserRegistrationAttemptCreate): Promise<UserRegistrationAttempt>
  addMany(inputs: UserRegistrationAttemptCreate[]): Promise<UserRegistrationAttempt[]>
  findById(attemptId: string): Promise<UserRegistrationAttempt | undefined>
  findActiveByEmail(email: string): Promise<UserRegistrationAttempt | undefined>
  findPendingByTokenHash(tokenHash: string): Promise<UserRegistrationAttempt | undefined>
  findByUserId(userId: string): Promise<UserRegistrationAttempt | undefined>
  findPendingExpiredByType(input: {
    type: RegistrationAttemptType
    cutoff: Date
    limit: number
  }): Promise<UserRegistrationAttempt[]>
  findStaleInvitationOperations(input: {
    staleBefore: Date
    limit: number
  }): Promise<UserRegistrationAttempt[]>
  claimForCleanup(input: {
    cutoff: Date
    staleBefore: Date
    claimedAt: Date
    claimToken: string
    limit: number
  }): Promise<UserRegistrationAttempt[]>
  clearCleanupClaim(input: {
    attemptId: string
    claimToken: string
    updatedAt: Date
  }): Promise<boolean>
  claimInvitationOperation(input: {
    attemptId: string
    expectedRevision: number
    operation: InvitationOperation
    operationToken: string
    claimedAt: Date
    staleBefore: Date
    pendingEmail?: string
    pendingTokenHash?: string
    pendingExpiresAt?: Date
  }): Promise<UserRegistrationAttempt | undefined>
  finalizeInvitationOperation(input: {
    attemptId: string
    operationToken: string
    changes: UserRegistrationAttemptUpdate
  }): Promise<UserRegistrationAttempt | undefined>
  clearInvitationOperation(input: {
    attemptId: string
    operationToken: string
    updatedAt: Date
  }): Promise<boolean>
  clearSupersededProviderSubject(input: {
    attemptId: string
    claimToken: string
    supersededProviderSubject: string
    updatedAt: Date
  }): Promise<boolean>
  replace(
    attemptId: string,
    changes: UserRegistrationAttemptUpdate,
  ): Promise<UserRegistrationAttempt>
  remove(attemptId: string): Promise<void>
  removeAll(): Promise<void>
}
