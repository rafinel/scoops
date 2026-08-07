import { AppError } from '#shared/domain/errors/app-error.ts'

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 'Requisição Inválida')
  }
}
