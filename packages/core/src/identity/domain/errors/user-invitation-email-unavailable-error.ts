import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserInvitationEmailUnavailableError extends ConflictError {
  constructor() {
    super('O e-mail do convite não está disponível.')
  }
}
