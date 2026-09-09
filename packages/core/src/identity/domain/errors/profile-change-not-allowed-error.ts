import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ProfileChangeNotAllowedError extends ConflictError {
  constructor() {
    super('A alteração do perfil não é permitida.')
  }
}
