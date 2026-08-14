import type { OnboardingIdentifierProvider } from '@scoops/core/identity/interfaces'

export class TestOnboardingIdentifierProvider implements OnboardingIdentifierProvider {
  private counter = 1

  generate() {
    const suffix = String(this.counter++).padStart(12, '0')
    return `40000000-0000-0000-0000-${suffix}`
  }

  clear() {
    this.counter = 1
  }
}
