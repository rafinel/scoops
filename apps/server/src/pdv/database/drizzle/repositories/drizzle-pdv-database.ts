import type { PdvDatabase, PdvDatabaseRepositories } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleDiscountsRepository } from '@/pdv/database/drizzle/repositories/drizzle-discounts-repository'
import { DrizzleOrderSequencesRepository } from '@/pdv/database/drizzle/repositories/drizzle-order-sequences-repository'
import { DrizzleOrdersRepository } from '@/pdv/database/drizzle/repositories/drizzle-orders-repository'
import { DrizzleSalesChannelsRepository } from '@/pdv/database/drizzle/repositories/drizzle-sales-channels-repository'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'

@Injectable()
export class DrizzlePdvDatabase implements PdvDatabase {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {}

  run<Result>(
    operation: (repositories: PdvDatabaseRepositories) => Promise<Result>,
  ): Promise<Result> {
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (repositories: PdvDatabaseRepositories) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) => {
          return this.transactionContext.run(transaction, () =>
            operation({
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
              eventsRepository: new DrizzleEventsRepository(
                this.drizzleClient,
                transaction,
              ),
            }),
          )
        },
        { isolationLevel: 'serializable', accessMode: 'read write' },
      )
    } catch (error) {
      if (!this.isRetryableTransactionConflict(error)) throw error
      if (hasRetried)
        throw new ConflictError('A operação no banco de dados entrou em conflito.')
      return this.runWithRetry(operation, true)
    }
  }

  readSnapshot<Result>(
    operation: (
      repositories: Pick<
        PdvDatabaseRepositories,
        'ordersRepository' | 'salesChannelsRepository'
      >,
    ) => Promise<Result>,
  ): Promise<Result> {
    return this.drizzleClient.requireDatabase().transaction(
      async (transaction) =>
        this.transactionContext.run(transaction, () =>
          operation({
            ordersRepository: new DrizzleOrdersRepository(
              this.drizzleClient,
              transaction,
            ),
            salesChannelsRepository: new DrizzleSalesChannelsRepository(
              this.drizzleClient,
              transaction,
            ),
          }),
        ),
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    )
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
