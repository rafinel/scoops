import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class OnboardingConfirmationRateLimitedError extends TooManyRequestsError {
  constructor() {
    super(
      'Você atingiu o limite de e-mails de confirmação. Aguarde alguns minutos antes de tentar novamente.',
      'Limite de confirmações atingido',
    )
  }
}
