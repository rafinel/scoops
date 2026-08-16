import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'

export class UserInvitationExpiredError extends BadRequestError {
  constructor() {
    super('User invitation has expired')
  }
}
