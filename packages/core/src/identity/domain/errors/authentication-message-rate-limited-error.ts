import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class AuthenticationMessageRateLimitedError extends TooManyRequestsError {
  constructor() {
    super('The authentication message limit has been reached')
  }
}
