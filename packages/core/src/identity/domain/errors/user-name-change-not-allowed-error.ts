import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class UserNameChangeNotAllowedError extends ConflictError {
  constructor() {
    super('A alteração do nome do usuário não é permitida.')
  }
}
