import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class InvalidOnboardingCredentialsError extends AuthorizationError {
  constructor() {
    super('Os dados de acesso do cadastro são inválidos.')
  }
}
