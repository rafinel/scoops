import type { MrpDatabase, MrpDatabaseScope } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

import { DrizzleProductsRepository } from './drizzle-products-repository'
import { DrizzleBrandsRepository } from './drizzle-brands-repository'
import { DrizzleProductionIngredientsRepository } from './drizzle-production-ingredients-repository'
import { DrizzleProductionsRepository } from './drizzle-productions-repository'
import { DrizzleRecipeIngredientsRepository } from './drizzle-recipe-ingredients-repository'
import { DrizzleRecipesRepository } from './drizzle-recipes-repository'
import { DrizzleStockBalancesRepository } from './drizzle-stock-balances-repository'
import { DrizzleStockTransactionsRepository } from './drizzle-stock-transactions-repository'

@Injectable()
export class DrizzleMrpDatabase implements MrpDatabase {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  run<Result>(operation: (scope: MrpDatabaseScope) => Promise<Result>): Promise<Result> {
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (scope: MrpDatabaseScope) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) =>
          operation({
            productsRepository: new DrizzleProductsRepository(
              this.drizzleClient,
              transaction,
            ),
            brandsRepository: new DrizzleBrandsRepository(
              this.drizzleClient,
              transaction,
            ),
            stockBalancesRepository: new DrizzleStockBalancesRepository(
              this.drizzleClient,
              transaction,
            ),
            stockTransactionsRepository: new DrizzleStockTransactionsRepository(
              this.drizzleClient,
              transaction,
            ),
            recipesRepository: new DrizzleRecipesRepository(
              this.drizzleClient,
              transaction,
            ),
            recipeIngredientsRepository: new DrizzleRecipeIngredientsRepository(
              this.drizzleClient,
              transaction,
            ),
            productionsRepository: new DrizzleProductionsRepository(
              this.drizzleClient,
              transaction,
            ),
            productionIngredientsRepository: new DrizzleProductionIngredientsRepository(
              this.drizzleClient,
              transaction,
            ),
            productSizesRepository: undefined as never,
            accompanimentTypesRepository: undefined as never,
            productAccompanimentsRepository: undefined as never,
            resaleConfigurationsRepository: undefined as never,
          }),
        { isolationLevel: 'serializable', accessMode: 'read write' },
      )
    } catch (error) {
      if (!this.isRetryableTransactionConflict(error)) throw error
      if (hasRetried) throw new ConflictError('Database operation conflicted')
      return this.runWithRetry(operation, true)
    }
  }

  private isRetryableTransactionConflict(error: unknown): boolean {
    let currentError: unknown = error
    while (currentError && typeof currentError === 'object') {
      if (
        'code' in currentError &&
        (currentError.code === '40001' || currentError.code === '40P01')
      )
        return true
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }
}
