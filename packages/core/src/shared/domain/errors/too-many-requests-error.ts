import { AppError } from '#shared/domain/errors/app-error.ts'

export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Muitas solicitações foram feitas. Aguarde alguns instantes e tente novamente.',
    title = 'Muitas Solicitações',
  ) {
    super(message, title)
  }
}
