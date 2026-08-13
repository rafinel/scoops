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
  replace(
    attemptId: string,
    changes: UserRegistrationAttemptUpdate,
  ): Promise<UserRegistrationAttempt>
  remove(attemptId: string): Promise<void>
  removeAll(): Promise<void>
}
