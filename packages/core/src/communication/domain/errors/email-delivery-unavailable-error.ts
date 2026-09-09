import { ServiceUnavailableError } from '#shared/domain/errors/service-unavailable-error.ts'

export class EmailDeliveryUnavailableError extends ServiceUnavailableError {
  constructor() {
    super('Não foi possível enviar o e-mail no momento. Tente novamente mais tarde.')
  }
}
