import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class OnboardingConfirmationRateLimitedError extends TooManyRequestsError {
  constructor() {
    super('Confirmation email rate limit reached')
  }
}
