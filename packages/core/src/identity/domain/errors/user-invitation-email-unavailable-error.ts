import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserInvitationEmailUnavailableError extends ConflictError {
  constructor() {
    super('User invitation email is unavailable')
  }
}
