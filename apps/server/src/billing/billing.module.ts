import { Module } from '@nestjs/common'

import { BillingDatabaseModule } from '@/billing/database/billing-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [BillingDatabaseModule, ProvisionModule],
  exports: [BillingDatabaseModule],
})
export class BillingModule {}
