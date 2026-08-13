import { AppError } from '@scoops/core/shared/domain/errors'

export class AuthRouteUnavailableError extends AppError {
  constructor() {
    super(
      'Não foi possível verificar o acesso agora. Tente novamente.',
      'Acesso indisponível',
    )
  }
}
