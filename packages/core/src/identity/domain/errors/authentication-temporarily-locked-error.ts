import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationTemporarilyLockedError extends AuthorizationError {
  constructor() {
    super('The account is temporarily locked')
  }
}
