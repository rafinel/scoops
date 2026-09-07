import { Module } from '@nestjs/common'

import { TransactionBoundOrderRegistrationDependenciesFactory } from '@/mrp/provision/pdv/transaction-bound-order-registration-dependencies-factory'
import { MRP_PROVIDERS } from '@/mrp/constants'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
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
