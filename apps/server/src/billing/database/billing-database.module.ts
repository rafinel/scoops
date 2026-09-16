import { Module } from '@nestjs/common'

import { BILLING_REPOSITORIES } from '@/billing/constants'
import { DrizzleSubscriptionsRepository } from '@/billing/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { BillingSeeder } from '@/billing/database/billing-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleSubscriptionsRepository,
    BillingSeeder,
    {
      provide: BILLING_REPOSITORIES.subscriptions,
      useExisting: DrizzleSubscriptionsRepository,
    },
  ],
  exports: [BILLING_REPOSITORIES.subscriptions, BillingSeeder],
})
export class BillingDatabaseModule {}
