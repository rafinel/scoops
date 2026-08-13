import { randomUUID } from 'node:crypto'

import type { OnboardingIdentifierProvider } from '@scoops/core/identity/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class NodeOnboardingIdentifierProvider implements OnboardingIdentifierProvider {
  generate(): string {
    return randomUUID()
  }
}
