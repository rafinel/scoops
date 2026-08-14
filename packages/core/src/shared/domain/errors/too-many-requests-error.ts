import { AppError } from '#shared/domain/errors/app-error.ts'

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 'Too Many Requests')
  }
}
