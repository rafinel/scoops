import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'

export class AuthenticationProviderUnavailableError extends ServiceUnavailableError {
  constructor() {
    super('Authentication service unavailable')
  }
}
