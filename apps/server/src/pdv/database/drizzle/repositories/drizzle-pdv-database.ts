import type { PdvDatabase, PdvDatabaseScope } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleSalesChannelsRepository } from '@/pdv/database/drizzle/repositories/drizzle-sales-channels-repository'

@Injectable()
export class DrizzlePdvDatabase implements PdvDatabase {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  run<Result>(operation: (scope: PdvDatabaseScope) => Promise<Result>): Promise<Result> {
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (scope: PdvDatabaseScope) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) =>
          operation({
            salesChannelsRepository: new DrizzleSalesChannelsRepository(
              this.drizzleClient,
              transaction,
            ),
          } as unknown as PdvDatabaseScope),
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
