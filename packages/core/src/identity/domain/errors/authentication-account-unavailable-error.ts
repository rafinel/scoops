import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationAccountUnavailableError extends AuthorizationError {
  constructor() {
    super('A conta não está disponível.')
  }
}
