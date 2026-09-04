import type { AuthenticationSessionsRepository } from '@scoops/core/identity/interfaces'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { betterAuthSessionModel } from '@/identity/database/drizzle/models/better-auth-session-model'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleAuthenticationSessionsRepository
  extends DrizzleRepository
  implements AuthenticationSessionsRepository
{
  async removeAllByProviderSubject(providerSubject: string): Promise<void> {
    await this.database
      .delete(betterAuthSessionModel)
      .where(eq(betterAuthSessionModel.userId, providerSubject))
  }
}
