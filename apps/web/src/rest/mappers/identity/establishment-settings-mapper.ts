import type { EstablishmentSettings } from '@scoops/core/identity/domain/structures'
import { AppError } from '@scoops/core/shared/domain/errors'

import { IdentityDateMapper } from './date-mapper'

export type EstablishmentSettingsJson = Omit<EstablishmentSettings, 'establishment'> & {
  establishment: Omit<
    EstablishmentSettings['establishment'],
    'createdAt' | 'updatedAt'
  > & {
    createdAt: string
    updatedAt: string
  }
}

export const EstablishmentSettingsMapper = (
  response: EstablishmentSettingsJson,
): EstablishmentSettings => {
  if (
    !response?.establishment ||
    typeof response.establishment.id !== 'string' ||
    typeof response.establishment.name !== 'string' ||
    typeof response.establishment.status !== 'string' ||
    !response.responsibleManager
  ) {
    throw new AppError('Resposta inesperada das configurações do estabelecimento')
  }

  return {
    establishment: {
      ...response.establishment,
      createdAt: IdentityDateMapper(
        response.establishment.createdAt,
        'Resposta inesperada das configurações do estabelecimento',
      ),
      updatedAt: IdentityDateMapper(
        response.establishment.updatedAt,
        'Resposta inesperada das configurações do estabelecimento',
      ),
    },
    responsibleManager: response.responsibleManager,
  }
}
