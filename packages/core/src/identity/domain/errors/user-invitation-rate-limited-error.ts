import { TooManyRequestsError } from '#shared/domain/errors/too-many-requests-error.ts'

export class UserInvitationRateLimitedError extends TooManyRequestsError {
  constructor() {
    super(
      'O limite de envio de e-mails foi atingido. Aguarde um minuto e tente novamente.',
    )
  }
}
