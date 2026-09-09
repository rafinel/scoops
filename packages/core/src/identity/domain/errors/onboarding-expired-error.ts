import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'

export class OnboardingExpiredError extends BadRequestError {
  constructor() {
    super('Este cadastro expirou.')
  }
}
