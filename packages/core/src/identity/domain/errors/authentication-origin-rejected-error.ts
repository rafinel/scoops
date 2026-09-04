import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationOriginRejectedError extends AuthorizationError {
  constructor() {
    super('The request origin is not trusted')
  }
}
