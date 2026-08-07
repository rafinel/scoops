import { AppError } from '#shared/domain/errors/app-error.ts'

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'Erro de Não Encontrado')
  }
}
