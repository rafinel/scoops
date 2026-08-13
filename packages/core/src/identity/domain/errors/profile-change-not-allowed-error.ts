import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ProfileChangeNotAllowedError extends ConflictError {
  constructor() {
    super('Profile change not allowed')
  }
}
