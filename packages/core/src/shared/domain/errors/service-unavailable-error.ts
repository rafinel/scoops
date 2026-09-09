import { AppError } from '#shared/domain/errors/app-error.ts'

export class ServiceUnavailableError extends AppError {
  constructor(message = 'O serviço está indisponível.') {
    super(message, 'Serviço Indisponível')
  }
}
