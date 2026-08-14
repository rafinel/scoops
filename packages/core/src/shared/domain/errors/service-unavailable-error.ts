import { AppError } from '#shared/domain/errors/app-error.ts'

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 'Service Unavailable')
  }
}
