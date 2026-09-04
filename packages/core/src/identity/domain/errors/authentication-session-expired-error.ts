import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationSessionExpiredError extends AuthorizationError {
  constructor() {
    super('The authentication session has expired')
  }
}
