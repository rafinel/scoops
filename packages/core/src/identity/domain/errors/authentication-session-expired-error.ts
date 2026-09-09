import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationSessionExpiredError extends AuthorizationError {
  constructor() {
    super('A sessão de autenticação expirou.')
  }
}
