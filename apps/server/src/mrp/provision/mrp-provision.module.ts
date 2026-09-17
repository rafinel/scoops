import { Module } from '@nestjs/common'

import { MRP_PROVIDERS } from '@/mrp/constants'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import {
  ConsumeOrderStockUseCase,
  RestoreOrderStockUseCase,
} from '@scoops/core/mrp/use-cases'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { MRP_REPOSITORIES } from '@/mrp/constants'

@Module({
  imports: [SharedDatabaseModule, MrpDatabaseModule],
  providers: [
    {
      provide: ConsumeOrderStockUseCase,
      useFactory: (database: MrpDatabase) => new ConsumeOrderStockUseCase(database),
      inject: [MRP_REPOSITORIES.database],
    },
    {
      provide: RestoreOrderStockUseCase,
      useFactory: (database: MrpDatabase) => new RestoreOrderStockUseCase(database),
      inject: [MRP_REPOSITORIES.database],
    },
    { provide: MRP_PROVIDERS.consumeOrderStock, useExisting: ConsumeOrderStockUseCase },
    { provide: MRP_PROVIDERS.restoreOrderStock, useExisting: RestoreOrderStockUseCase },
  ],
  exports: [MRP_PROVIDERS.consumeOrderStock, MRP_PROVIDERS.restoreOrderStock],
})
export class MrpProvisionModule {}
