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
    throw new AppError('Unexpected establishment settings response')
  }

  return {
    establishment: {
      ...response.establishment,
      createdAt: IdentityDateMapper(
        response.establishment.createdAt,
        'Unexpected establishment settings response',
      ),
      updatedAt: IdentityDateMapper(
        response.establishment.updatedAt,
        'Unexpected establishment settings response',
      ),
    },
    responsibleManager: response.responsibleManager,
  }
}
