import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import {
  DrizzleBrandsRepository,
  DrizzleAccompanimentTypesRepository,
  DrizzleMrpDatabase,
  DrizzleProductsRepository,
  DrizzleProductAccompanimentsRepository,
  DrizzleProductSizesRepository,
  DrizzleProductionIngredientsRepository,
  DrizzleProductionsRepository,
  DrizzleRecipeIngredientsRepository,
  DrizzleRecipesRepository,
  DrizzleResaleConfigurationsRepository,
  DrizzleStockBalancesRepository,
  DrizzleStockTransactionsRepository,
} from '@/mrp/database/drizzle/repositories'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleAccompanimentTypesRepository,
    DrizzleProductsRepository,
    DrizzleProductAccompanimentsRepository,
    DrizzleProductSizesRepository,
    DrizzleBrandsRepository,
    DrizzleStockBalancesRepository,
    DrizzleStockTransactionsRepository,
    DrizzleRecipesRepository,
    DrizzleResaleConfigurationsRepository,
    DrizzleRecipeIngredientsRepository,
    DrizzleProductionsRepository,
    DrizzleProductionIngredientsRepository,
    DrizzleMrpDatabase,
    MrpSeeder,
    {
      provide: MRP_REPOSITORIES.accompanimentTypes,
      useExisting: DrizzleAccompanimentTypesRepository,
    },
    {
      provide: MRP_REPOSITORIES.productAccompaniments,
      useExisting: DrizzleProductAccompanimentsRepository,
    },
    { provide: MRP_REPOSITORIES.products, useExisting: DrizzleProductsRepository },
    {
      provide: MRP_REPOSITORIES.productSizes,
      useExisting: DrizzleProductSizesRepository,
    },
    { provide: MRP_REPOSITORIES.brands, useExisting: DrizzleBrandsRepository },
    { provide: MRP_REPOSITORIES.recipes, useExisting: DrizzleRecipesRepository },
    {
      provide: MRP_REPOSITORIES.resaleConfigurations,
      useExisting: DrizzleResaleConfigurationsRepository,
    },
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
    MRP_REPOSITORIES.accompanimentTypes,
    MRP_REPOSITORIES.productAccompaniments,
    MRP_REPOSITORIES.products,
    MRP_REPOSITORIES.productSizes,
    MRP_REPOSITORIES.brands,
    MRP_REPOSITORIES.recipes,
    MRP_REPOSITORIES.resaleConfigurations,
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
