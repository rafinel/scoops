import { ServiceUnavailableError } from '#shared/domain/errors/service-unavailable-error.ts'

export class AuthenticationProviderUnavailableError extends ServiceUnavailableError {
  constructor() {
    super('Authentication service unavailable')
  }
}
