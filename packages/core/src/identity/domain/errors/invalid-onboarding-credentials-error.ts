import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'

export class InvalidOnboardingCredentialsError extends AuthorizationError {
  constructor() {
    super('The onboarding credentials are invalid')
  }
}
