import { Module } from '@nestjs/common'

import { TransactionBoundOrderRegistrationDependenciesFactory } from '@/mrp/provision/pdv/transaction-bound-order-registration-dependencies-factory'
import { MRP_PROVIDERS } from '@/mrp/constants'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [SharedDatabaseModule, SharedMessagingModule],
  providers: [
    TransactionBoundOrderRegistrationDependenciesFactory,
    {
      provide: MRP_PROVIDERS.orderRegistrationDependencies,
      useExisting: TransactionBoundOrderRegistrationDependenciesFactory,
    },
  ],
  exports: [MRP_PROVIDERS.orderRegistrationDependencies],
})
export class MrpProvisionModule {}
