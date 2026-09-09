import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserStatusChangeNotAllowedError extends ConflictError {
  constructor() {
    super('A alteração do status do usuário não é permitida.')
  }
}
