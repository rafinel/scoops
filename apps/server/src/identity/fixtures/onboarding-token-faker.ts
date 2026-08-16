import { createHash } from 'node:crypto'

import { faker } from '@faker-js/faker'
import type { OnboardingTokenProvider } from '@scoops/core/identity/interfaces'

export class OnboardingTokenProviderFaker {
  static fake(): OnboardingTokenProvider {
    return {
      issue: () => {
        const token = faker.string.alphanumeric({ length: 43 })

        return { token, hash: hashToken(token) }
      },
      hash: hashToken,
    }
  }

  static fakeMany(count = 10): OnboardingTokenProvider[] {
    return Array.from({ length: count }, () => OnboardingTokenProviderFaker.fake())
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
