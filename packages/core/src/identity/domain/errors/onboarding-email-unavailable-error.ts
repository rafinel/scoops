import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class OnboardingEmailUnavailableError extends ConflictError {
  constructor() {
    super('Este endereço de e-mail não está disponível.')
  }
}
