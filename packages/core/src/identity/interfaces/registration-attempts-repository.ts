import type {
  UserRegistrationAttempt,
  UserRegistrationAttemptCreate,
  UserRegistrationAttemptUpdate,
} from '#identity/domain/entities/user-registration-attempt.ts'

export interface RegistrationAttemptsRepository {
  add(input: UserRegistrationAttemptCreate): Promise<UserRegistrationAttempt>
  addMany(inputs: UserRegistrationAttemptCreate[]): Promise<UserRegistrationAttempt[]>
  findById(attemptId: string): Promise<UserRegistrationAttempt | undefined>
  findActiveByEmail(email: string): Promise<UserRegistrationAttempt | undefined>
  findPendingByTokenHash(tokenHash: string): Promise<UserRegistrationAttempt | undefined>
  findByUserId(userId: string): Promise<UserRegistrationAttempt | undefined>
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
