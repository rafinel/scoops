import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '@scoops/core/identity/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleEstablishmentsRepository } from '@/identity/database/drizzle/repositories/drizzle-establishments-repository'
import { DrizzleRegistrationAttemptsRepository } from '@/identity/database/drizzle/repositories/drizzle-registration-attempts-repository'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories/drizzle-users-repository'
import { DrizzleUserAuditRecordsRepository } from '@/identity/database/drizzle/repositories/drizzle-user-audit-records-repository'
import { DrizzleEstablishmentAuditRecordsRepository } from '@/identity/database/drizzle/repositories/drizzle-establishment-audit-records-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleIdentityDatabase implements IdentityDatabase {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  run<Result>(
    operation: (scope: IdentityDatabaseScope) => Promise<Result>,
  ): Promise<Result> {
    return this.runWithRetry(operation, false)
  }

  private async runWithRetry<Result>(
    operation: (scope: IdentityDatabaseScope) => Promise<Result>,
    hasRetried: boolean,
  ): Promise<Result> {
    try {
      return await this.drizzleClient.requireDatabase().transaction(
        async (transaction) =>
          operation({
            establishmentsRepository: new DrizzleEstablishmentsRepository(
              this.drizzleClient,
              transaction,
            ),
            registrationAttemptsRepository: new DrizzleRegistrationAttemptsRepository(
              this.drizzleClient,
              transaction,
            ),
            usersRepository: new DrizzleUsersRepository(this.drizzleClient, transaction),
            userAuditRecordsRepository: new DrizzleUserAuditRecordsRepository(
              this.drizzleClient,
              transaction,
            ),
            establishmentAuditRecordsRepository:
              new DrizzleEstablishmentAuditRecordsRepository(
                this.drizzleClient,
                transaction,
              ),
          }),
        {
          isolationLevel: 'serializable',
          accessMode: 'read write',
        },
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
