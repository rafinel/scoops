import type { AccompanimentTypesRepository } from '#mrp/interfaces/accompaniment-types-repository.ts'
import type { BrandsRepository } from '#mrp/interfaces/brands-repository.ts'
import type { ProductAccompanimentsRepository } from '#mrp/interfaces/product-accompaniments-repository.ts'
import type { ProductSizesRepository } from '#mrp/interfaces/product-sizes-repository.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { ProductionIngredientsRepository } from '#mrp/interfaces/production-ingredients-repository.ts'
import type { ProductionsRepository } from '#mrp/interfaces/productions-repository.ts'
import type { RecipeIngredientsRepository } from '#mrp/interfaces/recipe-ingredients-repository.ts'
import type { RecipesRepository } from '#mrp/interfaces/recipes-repository.ts'
import type { ResaleConfigurationsRepository } from '#mrp/interfaces/resale-configurations-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'

export type MrpDatabaseScope = {
  productsRepository: ProductsRepository
  brandsRepository: BrandsRepository
  recipesRepository: RecipesRepository
  recipeIngredientsRepository: RecipeIngredientsRepository
  productionsRepository: ProductionsRepository
  productionIngredientsRepository: ProductionIngredientsRepository
  stockBalancesRepository: StockBalancesRepository
  stockTransactionsRepository: StockTransactionsRepository
  productSizesRepository: ProductSizesRepository
  accompanimentTypesRepository: AccompanimentTypesRepository
  productAccompanimentsRepository: ProductAccompanimentsRepository
  resaleConfigurationsRepository: ResaleConfigurationsRepository
}

export interface MrpDatabase {
  run<Result>(operation: (scope: MrpDatabaseScope) => Promise<Result>): Promise<Result>
}
