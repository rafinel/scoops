import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class AuthenticationOriginRejectedError extends AuthorizationError {
  constructor() {
    super('A origem da solicitação não é confiável.')
  }
}
