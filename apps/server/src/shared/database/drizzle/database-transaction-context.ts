import { AsyncLocalStorage } from 'node:async_hooks'

import { Injectable } from '@nestjs/common'

import type { DrizzleExecutor } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DatabaseTransactionContext {
  private readonly storage = new AsyncLocalStorage<DrizzleExecutor>()

  get(): DrizzleExecutor | undefined {
    return this.storage.getStore()
  }

  run<Result>(
    transaction: DrizzleExecutor,
    operation: () => Promise<Result>,
  ): Promise<Result> {
    const activeTransaction = this.storage.getStore()
    if (activeTransaction) return operation()

    return this.storage.run(transaction, operation)
  }
}
