import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import {
  DrizzleBrandsRepository,
  DrizzleMrpDatabase,
  DrizzleProductsRepository,
  DrizzleStockBalancesRepository,
  DrizzleStockTransactionsRepository,
} from '@/mrp/database/drizzle/repositories'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleProductsRepository,
    DrizzleBrandsRepository,
    DrizzleStockBalancesRepository,
    DrizzleStockTransactionsRepository,
    DrizzleMrpDatabase,
    MrpSeeder,
    { provide: MRP_REPOSITORIES.products, useExisting: DrizzleProductsRepository },
    { provide: MRP_REPOSITORIES.brands, useExisting: DrizzleBrandsRepository },
    {
      provide: MRP_REPOSITORIES.stockBalances,
      useExisting: DrizzleStockBalancesRepository,
    },
    {
      provide: MRP_STOCK_TRANSACTIONS_REPOSITORY,
      useExisting: DrizzleStockTransactionsRepository,
    },
    { provide: MRP_REPOSITORIES.database, useExisting: DrizzleMrpDatabase },
  ],
  exports: [
    MRP_REPOSITORIES.products,
    MRP_REPOSITORIES.brands,
    MRP_REPOSITORIES.stockBalances,
    MRP_STOCK_TRANSACTIONS_REPOSITORY,
    MRP_REPOSITORIES.database,
    MrpSeeder,
  ],
})
export class MrpDatabaseModule {}
