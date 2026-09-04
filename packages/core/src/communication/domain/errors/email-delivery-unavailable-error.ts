import { ServiceUnavailableError } from '#shared/domain/errors/service-unavailable-error.ts'

export class EmailDeliveryUnavailableError extends ServiceUnavailableError {
  constructor() {
    super('Email delivery is unavailable')
  }
}
