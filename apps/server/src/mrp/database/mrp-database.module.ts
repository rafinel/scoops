import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { DrizzleMrpDatabase } from '@/mrp/database/drizzle/repositories/drizzle-mrp-database'
import { DrizzleProductsRepository } from '@/mrp/database/drizzle/repositories/drizzle-products-repository'
import { DrizzleBrandsRepository } from '@/mrp/database/drizzle/repositories/drizzle-brands-repository'
import { DrizzleStockBalancesRepository } from '@/mrp/database/drizzle/repositories/drizzle-stock-balances-repository'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleProductsRepository,
    DrizzleBrandsRepository,
    DrizzleStockBalancesRepository,
    DrizzleMrpDatabase,
    MrpSeeder,
    { provide: MRP_REPOSITORIES.products, useExisting: DrizzleProductsRepository },
    { provide: MRP_REPOSITORIES.brands, useExisting: DrizzleBrandsRepository },
    {
      provide: MRP_REPOSITORIES.stockBalances,
      useExisting: DrizzleStockBalancesRepository,
    },
    { provide: MRP_REPOSITORIES.database, useExisting: DrizzleMrpDatabase },
  ],
  exports: [
    MRP_REPOSITORIES.products,
    MRP_REPOSITORIES.brands,
    MRP_REPOSITORIES.stockBalances,
    MRP_REPOSITORIES.database,
    MrpSeeder,
  ],
})
export class MrpDatabaseModule {}
