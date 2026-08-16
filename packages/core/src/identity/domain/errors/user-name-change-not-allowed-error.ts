import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserNameChangeNotAllowedError extends ConflictError {
  constructor() {
    super('User name change not allowed')
  }
}
