import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'
import { ExpireIceCreamShopOnboardingsUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingIdentityProvider,
  OnboardingIdentifierProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ExpireIceCreamShopOnboardingsJob extends InngestJob {
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
  ) {
    super(inngest)
    this.useCase = new ExpireIceCreamShopOnboardingsUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingIdentityProvider,
    )
    this.function = this.inngest.createFunction(
      { id: 'identity/expire-ice-cream-shop-onboardings', triggers: [cron('0 * * * *')] },
      async () =>
        this.useCase.execute({
          limit: 100,
          claimToken: onboardingIdentifierProvider.generate(),
        }),
    )
  }
}
