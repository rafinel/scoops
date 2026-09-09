import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'

export class UserInvitationExpiredError extends BadRequestError {
  constructor() {
    super('O convite do usuário expirou.')
  }
}
