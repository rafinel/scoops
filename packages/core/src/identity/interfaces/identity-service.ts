import type { Account } from '#identity/domain/entities/account.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { IceCreamShopOnboardingInput } from '#identity/domain/structures/ice-cream-shop-onboarding-input.ts'
import type { IceCreamShopOnboardingRegistration } from '#identity/domain/structures/ice-cream-shop-onboarding-registration.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'

export interface IdentityService {
  getAccount(): Promise<RestResponse<Account>>
  registerIceCreamShop(
    request: IceCreamShopOnboardingInput,
  ): Promise<RestResponse<IceCreamShopOnboardingRegistration>>
  getIceCreamShopOnboarding(request: {
    continuationToken: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  resendIceCreamShopConfirmation(request: {
    continuationToken: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  correctIceCreamShopOnboardingEmail(request: {
    continuationToken: string
    email: string
    password: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  confirmIceCreamShopOnboarding(request: {
    confirmationToken: string
  }): Promise<RestResponse<void>>
}
