import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'
import type { UserDetails } from '@scoops/core/identity/domain/structures'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import {
  PendingIceCreamShopOnboardingMapper,
  type PendingIceCreamShopOnboardingJson,
} from './pending-ice-cream-shop-onboarding-mapper'
import { UserDetailsMapper, type UserDetailsJson } from './user-details-mapper'

export const PendingOnboardingResponseMapper = (
  response: RestResponse<PendingIceCreamShopOnboardingJson>,
): RestResponse<PendingIceCreamShopOnboarding> => {
  if (!response.isSuccessful) {
    return response as unknown as RestResponse<PendingIceCreamShopOnboarding>
  }

  return new RestResponse({
    body: PendingIceCreamShopOnboardingMapper(response.body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

export const UserDetailsResponseMapper = (
  response: RestResponse<UserDetailsJson>,
): RestResponse<UserDetails> => {
  if (!response.isSuccessful) {
    return response as unknown as RestResponse<UserDetails>
  }

  return new RestResponse({
    body: UserDetailsMapper(response.body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}
