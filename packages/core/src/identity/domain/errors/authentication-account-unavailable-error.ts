import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationAccountUnavailableError extends AuthorizationError {
  constructor() {
    super('The account is unavailable')
  }
}
