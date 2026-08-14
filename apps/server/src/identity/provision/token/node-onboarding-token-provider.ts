import { createHash, randomBytes } from 'node:crypto'

import type { OnboardingTokenProvider } from '@scoops/core/identity/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class NodeOnboardingTokenProvider implements OnboardingTokenProvider {
  issue(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url')

    return { token, hash: this.hash(token) }
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex')
  }
}
