import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'
import { AppError } from '@scoops/core/shared/domain/errors'

import { IdentityDateMapper } from './date-mapper'

export type PendingIceCreamShopOnboardingJson = Omit<
  PendingIceCreamShopOnboarding,
  'expiresAt'
> & { expiresAt: string }

const ISO_DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

export const PendingIceCreamShopOnboardingMapper = (
  response: PendingIceCreamShopOnboardingJson,
): PendingIceCreamShopOnboarding => {
  if (
    !response ||
    typeof response.establishmentName !== 'string' ||
    typeof response.managerName !== 'string' ||
    typeof response.email !== 'string' ||
    typeof response.expiresAt !== 'string' ||
    !ISO_DATETIME_WITH_OFFSET.test(response.expiresAt)
  ) {
    throw new AppError('Unexpected onboarding response')
  }

  const expiresAt = IdentityDateMapper(
    response.expiresAt,
    'Unexpected onboarding response',
  )

  return { ...response, expiresAt }
}
