import type { SubscriptionCreate } from '@scoops/core/billing/domain/entities'
import { Inject, Injectable } from '@nestjs/common'

import { BILLING_REPOSITORIES } from '@/billing/constants'
import type { SubscriptionsRepository } from '@scoops/core/billing/interfaces'

export type BillingSeed = {
  subscriptions: SubscriptionCreate[]
}

@Injectable()
export class BillingSeeder {
  constructor(
    @Inject(BILLING_REPOSITORIES.subscriptions)
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async clear(): Promise<void> {
    await this.subscriptionsRepository.removeAll()
  }

  async run(seed: BillingSeed): Promise<void> {
    for (const subscription of seed.subscriptions) {
      await this.subscriptionsRepository.add(subscription)
    }
  }
}
