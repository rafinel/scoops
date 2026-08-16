import { faker } from '@faker-js/faker'
import type { OnboardingIdentifierProvider } from '@scoops/core/identity/interfaces'

export class OnboardingIdentifierProviderFaker {
  static fake(): OnboardingIdentifierProvider {
    return {
      generate: () => faker.string.uuid(),
    }
  }

  static fakeMany(count = 10): OnboardingIdentifierProvider[] {
    return Array.from({ length: count }, () => OnboardingIdentifierProviderFaker.fake())
  }
}
