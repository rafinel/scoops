import { AppError } from '@scoops/core/shared/domain/errors'

export class AuthenticationProviderUnavailableError extends AppError {
  constructor() {
    super('Authentication service unavailable', 'Authentication service unavailable')
  }
}
