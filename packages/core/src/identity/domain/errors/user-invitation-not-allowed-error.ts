import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserInvitationNotAllowedError extends ConflictError {
  constructor() {
    super('User invitation operation is not allowed')
  }
}
