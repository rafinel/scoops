import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class AuthenticationMessageRateLimitedError extends TooManyRequestsError {
  constructor() {
    super(
      'Você atingiu o limite de mensagens de autenticação. Aguarde alguns minutos antes de tentar novamente. Se o limite diário continuar, tente novamente amanhã.',
      'Limite de autenticação atingido',
    )
  }
}
