import type { IceCreamShopOnboardingRegistration } from '@scoops/core/identity/domain/structures'
import { AppError } from '@scoops/core/shared/domain/errors'

import {
  PendingIceCreamShopOnboardingMapper,
  type PendingIceCreamShopOnboardingJson,
} from './pending-ice-cream-shop-onboarding-mapper'

export type IceCreamShopOnboardingRegistrationJson =
  IceCreamShopOnboardingRegistration & {
    onboarding: PendingIceCreamShopOnboardingJson
  }

export const IceCreamShopOnboardingRegistrationMapper = (
  response: IceCreamShopOnboardingRegistrationJson,
): IceCreamShopOnboardingRegistration => {
  if (typeof response?.continuationToken !== 'string' || !response.onboarding) {
    throw new AppError('Unexpected onboarding response')
  }

  return {
    continuationToken: response.continuationToken,
    onboarding: PendingIceCreamShopOnboardingMapper(response.onboarding),
  }
}
