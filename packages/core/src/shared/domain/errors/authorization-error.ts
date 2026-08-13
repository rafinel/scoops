import { AppError } from '#shared/domain/errors/app-error.ts'

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 'Erro de Autorização')
  }
}
