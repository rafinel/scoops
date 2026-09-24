import type { INestApplication } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IdentityModule } from '@/identity/identity.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { SharedModule } from '@/shared/shared.module'
import { BillingDatabaseModule } from '@/billing/database/billing-database.module'

import { AnalyticsModule } from '@/analytics/analytics.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class AnalyticsModuleFixture {
  private constructor(private readonly restFixture: RestFixture) {}

  static async register(options: { auth: BetterAuthFixture; includeBilling?: boolean }) {
    const builderSetup = (builder: TestingModuleBuilder) => {
      builder
        .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
        .useValue(options.auth)
        .overrideProvider(IDENTITY_PROVIDERS.onboardingIdentity)
        .useValue(options.auth)
        .overrideProvider(IDENTITY_PROVIDERS.userAccessIdentity)
        .useValue(options.auth)
        .overrideProvider(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
        .useValue(options.auth)
        .overrideProvider(BetterAuthSessionIssuer)
        .useValue(options.auth)
      return builder
    }

    const imports = [
      SharedModule,
      IdentityModule,
      AnalyticsModule,
      InngestModule.forRoot({ functions: [] }),
    ]
    if (options.includeBilling) imports.push(BillingDatabaseModule)

    return new AnalyticsModuleFixture(
      await RestFixture.register({ imports }, builderSetup),
    )
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    await this.restFixture.close()
  }
}
