import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { Injectable } from '@nestjs/common'

import { DrizzleProductsRepository } from './drizzle-products-repository'
import { DrizzleBrandsRepository } from './drizzle-brands-repository'
import { DrizzleStockBalancesRepository } from './drizzle-stock-balances-repository'

@Injectable()
export class DrizzleMrpDatabase implements MrpDatabase {
  constructor(
    private readonly productsRepository: DrizzleProductsRepository,
    private readonly brandsRepository: DrizzleBrandsRepository,
    private readonly stockBalancesRepository: DrizzleStockBalancesRepository,
  ) {}

  async run<Result>(operation: Parameters<MrpDatabase['run']>[0]): Promise<Result> {
    return (await operation({
      productsRepository: this.productsRepository,
      stockBalancesRepository: this.stockBalancesRepository,
      brandsRepository: this.brandsRepository,
      recipesRepository: undefined as never,
      recipeIngredientsRepository: undefined as never,
      productSizesRepository: undefined as never,
      accompanimentTypesRepository: undefined as never,
      productAccompanimentsRepository: undefined as never,
      resaleConfigurationsRepository: undefined as never,
    })) as Result
  }
}
