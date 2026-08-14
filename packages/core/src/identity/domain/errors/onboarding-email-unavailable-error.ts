import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class OnboardingEmailUnavailableError extends ConflictError {
  constructor() {
    super('The email address is unavailable')
  }
}
