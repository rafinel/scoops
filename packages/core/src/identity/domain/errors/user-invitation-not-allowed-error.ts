import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserInvitationNotAllowedError extends ConflictError {
  constructor() {
    super('A operação de convite do usuário não é permitida.')
  }
}
