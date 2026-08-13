import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class InvalidCredentialsError extends AuthorizationError {
  constructor() {
    super('Identifier or password is invalid')
  }
}
