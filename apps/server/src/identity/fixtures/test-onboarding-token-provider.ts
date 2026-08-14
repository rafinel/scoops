import type { OnboardingTokenProvider } from '@scoops/core/identity/interfaces'

export class TestOnboardingTokenProvider implements OnboardingTokenProvider {
  private counter = 0
  private readonly hashes = new Map<string, string>()

  issue() {
    const token = String(this.counter++).padStart(43, 'a')
    const hash = `test-token-hash-${token}`
    this.hashes.set(token, hash)
    return { token, hash }
  }

  hash(token: string) {
    return this.hashes.get(token) ?? `test-token-hash-${token}`
  }

  clear() {
    this.counter = 0
    this.hashes.clear()
  }
}
