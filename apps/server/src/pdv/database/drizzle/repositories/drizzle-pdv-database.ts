import type {
  PdvDatabase,
  PdvDatabaseScope,
  SalesCatalogProvider,
  StockConsumer,
} from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { MRP_PROVIDERS } from '@/mrp/constants'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleDiscountsRepository } from '@/pdv/database/drizzle/repositories/drizzle-discounts-repository'
import { DrizzleOrderSequencesRepository } from '@/pdv/database/drizzle/repositories/drizzle-order-sequences-repository'
import { DrizzleOrdersRepository } from '@/pdv/database/drizzle/repositories/drizzle-orders-repository'
import { DrizzleSalesChannelsRepository } from '@/pdv/database/drizzle/repositories/drizzle-sales-channels-repository'
import type { DrizzleExecutor } from '@/shared/database/drizzle/drizzle-repository'

type TransactionBoundOrderRegistrationDependenciesFactory = {
  forExecutor(executor: DrizzleExecutor): {
    salesCatalogProvider: SalesCatalogProvider
    stockConsumer: StockConsumer
  }
}

@Injectable()
export class DrizzlePdvDatabase implements PdvDatabase {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(MRP_PROVIDERS.orderRegistrationDependencies)
    private readonly orderRegistrationDependenciesFactory: TransactionBoundOrderRegistrationDependenciesFactory,
  ) {}

  run<Result>(operation: (scope: PdvDatabaseScope) => Promise<Result>): Promise<Result> {
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (scope: PdvDatabaseScope) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) => {
          const transactionBoundDependencies =
            this.orderRegistrationDependenciesFactory.forExecutor(transaction)
          return operation({
            salesCatalogProvider: transactionBoundDependencies.salesCatalogProvider,
            salesChannelsRepository: new DrizzleSalesChannelsRepository(
              this.drizzleClient,
              transaction,
            ),
            discountsRepository: new DrizzleDiscountsRepository(
              this.drizzleClient,
              transaction,
            ),
            ordersRepository: new DrizzleOrdersRepository(
              this.drizzleClient,
              transaction,
            ),
            orderSequencesRepository: new DrizzleOrderSequencesRepository(
              this.drizzleClient,
              transaction,
            ),
            stockConsumer: transactionBoundDependencies.stockConsumer,
          })
        },
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
      ) {
        return true
      }
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }
}
