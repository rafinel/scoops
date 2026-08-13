import { TooManyRequestsError } from '@scoops/core/shared/domain/errors'

export class OnboardingConfirmationRateLimitedError extends TooManyRequestsError {
  constructor() {
    super('Confirmation email rate limit reached')
  }
}
