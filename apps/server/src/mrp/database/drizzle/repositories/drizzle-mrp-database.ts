import type { MrpDatabase, MrpDatabaseRepositories } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import type { DrizzleExecutor } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleAccompanimentTypesRepository } from './drizzle-accompaniment-types-repository'
import { DrizzleProductsRepository } from './drizzle-products-repository'
import { DrizzleProductAccompanimentsRepository } from './drizzle-product-accompaniments-repository'
import { DrizzleProductSizesRepository } from './drizzle-product-sizes-repository'
import { DrizzleBrandsRepository } from './drizzle-brands-repository'
import { DrizzleProductionIngredientsRepository } from './drizzle-production-ingredients-repository'
import { DrizzleProductionsRepository } from './drizzle-productions-repository'
import { DrizzleRecipeIngredientsRepository } from './drizzle-recipe-ingredients-repository'
import { DrizzleRecipesRepository } from './drizzle-recipes-repository'
import { DrizzleResaleConfigurationsRepository } from './drizzle-resale-configurations-repository'
import { DrizzleStockBalancesRepository } from './drizzle-stock-balances-repository'
import { DrizzleStockTransactionsRepository } from './drizzle-stock-transactions-repository'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'
import { DrizzleStockAttentionFactsRepository } from './drizzle-stock-attention-facts-repository'

@Injectable()
export class DrizzleMrpDatabase implements MrpDatabase {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {}

  run<Result>(
    operation: (repositories: MrpDatabaseRepositories) => Promise<Result>,
  ): Promise<Result> {
    const activeTransaction = this.transactionContext.get()
    if (activeTransaction) return operation(this.createRepositories(activeTransaction))
    return this.runWithRetry(operation, false)
  }

  async readSnapshot<Result>(
    operation: (
      repositories: Pick<MrpDatabaseRepositories, 'stockAttentionFactsRepository'>,
    ) => Promise<Result>,
  ): Promise<Result> {
    return this.drizzleClient.requireDatabase().transaction(
      (transaction) =>
        operation({
          stockAttentionFactsRepository: new DrizzleStockAttentionFactsRepository(
            this.drizzleClient,
            transaction,
          ),
        }),
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
  }

  private async runWithRetry<Result>(
    operation: (repositories: MrpDatabaseRepositories) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient
        .requireDatabase()
        .transaction(
          async (transaction) =>
            this.transactionContext.run(transaction, () =>
              operation(this.createRepositories(transaction)),
            ),
          { isolationLevel: 'serializable', accessMode: 'read write' },
        )
    } catch (error) {
      if (!this.isRetryableTransactionConflict(error)) throw error
      if (hasRetried)
        throw new ConflictError('A operação no banco de dados entrou em conflito.')
      return this.runWithRetry(operation, true)
    }
  }

  private createRepositories(executor: DrizzleExecutor): MrpDatabaseRepositories {
    return {
      productsRepository: new DrizzleProductsRepository(this.drizzleClient, executor),
      brandsRepository: new DrizzleBrandsRepository(this.drizzleClient, executor),
      stockBalancesRepository: new DrizzleStockBalancesRepository(
        this.drizzleClient,
        executor,
      ),
      stockTransactionsRepository: new DrizzleStockTransactionsRepository(
        this.drizzleClient,
        executor,
      ),
      recipesRepository: new DrizzleRecipesRepository(this.drizzleClient, executor),
      recipeIngredientsRepository: new DrizzleRecipeIngredientsRepository(
        this.drizzleClient,
        executor,
      ),
      productionsRepository: new DrizzleProductionsRepository(
        this.drizzleClient,
        executor,
      ),
      productionIngredientsRepository: new DrizzleProductionIngredientsRepository(
        this.drizzleClient,
        executor,
      ),
      productSizesRepository: new DrizzleProductSizesRepository(
        this.drizzleClient,
        executor,
      ),
      accompanimentTypesRepository: new DrizzleAccompanimentTypesRepository(
        this.drizzleClient,
        executor,
      ),
      productAccompanimentsRepository: new DrizzleProductAccompanimentsRepository(
        this.drizzleClient,
        executor,
      ),
      resaleConfigurationsRepository: new DrizzleResaleConfigurationsRepository(
        this.drizzleClient,
        executor,
      ),
      eventsRepository: new DrizzleEventsRepository(this.drizzleClient, executor),
      stockAttentionFactsRepository: new DrizzleStockAttentionFactsRepository(
        this.drizzleClient,
        executor,
      ),
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
