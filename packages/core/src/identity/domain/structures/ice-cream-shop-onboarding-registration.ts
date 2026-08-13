import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'

export type IceCreamShopOnboardingRegistration = {
  continuationToken: string
  onboarding: PendingIceCreamShopOnboarding
}
