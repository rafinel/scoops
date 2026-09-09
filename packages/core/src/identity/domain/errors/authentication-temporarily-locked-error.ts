import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationTemporarilyLockedError extends AuthorizationError {
  constructor() {
    super('A conta está temporariamente bloqueada.')
  }
}
