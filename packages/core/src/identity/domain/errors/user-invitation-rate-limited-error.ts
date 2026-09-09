import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class UserInvitationRateLimitedError extends TooManyRequestsError {
  constructor() {
    super(
      'Você atingiu o limite de envio de e-mails. Aguarde alguns minutos antes de tentar novamente.',
      'Limite de convites atingido',
    )
  }
}
