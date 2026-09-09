import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class InvalidCredentialsError extends AuthorizationError {
  constructor() {
    super('O e-mail ou a senha são inválidos.')
  }
}
