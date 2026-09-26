import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'
import { ExpireIceCreamShopOnboardingsUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingIdentityProvider,
  OnboardingIdentifierProvider,
  UserAccessIdentityProvider,
} from '@scoops/core/identity/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

@Injectable()
export class ExpireIceCreamShopOnboardingsJob extends InngestJob {
  static readonly ID = 'identity/expire-ice-cream-shop-onboardings'

  readonly function: InngestFunction.Like

  private readonly useCase: ExpireIceCreamShopOnboardingsUseCase

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    onboardingIdentityProvider: OnboardingIdentityProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    onboardingIdentifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.userAccessIdentity)
    userAccessIdentityProvider: UserAccessIdentityProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)
    this.useCase = new ExpireIceCreamShopOnboardingsUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingIdentityProvider,
      userAccessIdentityProvider,
    )
    this.function = this.inngest.createFunction(
      {
        id: ExpireIceCreamShopOnboardingsJob.ID,
        triggers: [cron('0 * * * *')],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            ExpireIceCreamShopOnboardingsJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, runId }) => {
        const result = await this.useCase.execute({
          limit: 100,
          claimToken: onboardingIdentifierProvider.generate(),
        })
        this.recordSuccessfulRun(ExpireIceCreamShopOnboardingsJob.ID, runId, event.ts)
        return result
      },
    )
  }
}
