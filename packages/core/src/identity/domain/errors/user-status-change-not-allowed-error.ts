import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserStatusChangeNotAllowedError extends ConflictError {
  constructor() {
    super('User status change not allowed')
  }
}
