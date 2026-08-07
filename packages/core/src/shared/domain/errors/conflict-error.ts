import { AppError } from '#shared/domain/errors/app-error.ts'

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'Erro de Conflito')
  }
}
