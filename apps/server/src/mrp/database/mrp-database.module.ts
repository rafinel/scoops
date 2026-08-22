import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import {
  DrizzleBrandsRepository,
  DrizzleMrpDatabase,
  DrizzleProductsRepository,
  DrizzleProductionIngredientsRepository,
  DrizzleProductionsRepository,
  DrizzleRecipeIngredientsRepository,
  DrizzleRecipesRepository,
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
    DrizzleRecipesRepository,
    DrizzleRecipeIngredientsRepository,
    DrizzleProductionsRepository,
    DrizzleProductionIngredientsRepository,
    DrizzleMrpDatabase,
    MrpSeeder,
    { provide: MRP_REPOSITORIES.products, useExisting: DrizzleProductsRepository },
    { provide: MRP_REPOSITORIES.brands, useExisting: DrizzleBrandsRepository },
    { provide: MRP_REPOSITORIES.recipes, useExisting: DrizzleRecipesRepository },
    {
      provide: MRP_REPOSITORIES.recipeIngredients,
      useExisting: DrizzleRecipeIngredientsRepository,
    },
    { provide: MRP_REPOSITORIES.productions, useExisting: DrizzleProductionsRepository },
    {
      provide: MRP_REPOSITORIES.productionIngredients,
      useExisting: DrizzleProductionIngredientsRepository,
    },
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
    MRP_REPOSITORIES.recipes,
    MRP_REPOSITORIES.recipeIngredients,
    MRP_REPOSITORIES.productions,
    MRP_REPOSITORIES.productionIngredients,
    MRP_REPOSITORIES.stockBalances,
    MRP_STOCK_TRANSACTIONS_REPOSITORY,
    MRP_REPOSITORIES.database,
    MrpSeeder,
  ],
})
export class MrpDatabaseModule {}
