import { and, eq, lte, lt } from 'drizzle-orm'
import type { OutboxDatabase } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { OUTBOX_DATABASE } from '@/shared/database/drizzle/outbox/outbox-database-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const MAX_ATTEMPTS = 10

@Injectable()
export class ReprocessEventsJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(OUTBOX_DATABASE) private readonly outboxDatabase: OutboxDatabase,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)
    this.function = this.inngest.createFunction(
      { id: 'shared/outbox-reprocess-events', triggers: [cron('* * * * *')] },
      async () => this.reprocess(),
    )
  }

  async reprocess(now = this.datetimeProvider.now()): Promise<{
    failed: number
    expiredPublishing: number
  }> {
    const database = this.drizzleClient.requireDatabase()
    const result = await database.transaction(async (transaction) => {
      const failed = await transaction
        .update(eventModel)
        .set({
          status: 'pending',
          availableAt: now,
          reservedBy: null,
          reservationExpiresAt: null,
          lastErrorCode: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(eventModel.status, 'failed'),
            lte(eventModel.availableAt, now),
            lt(eventModel.attempts, MAX_ATTEMPTS),
          ),
        )
        .returning({ id: eventModel.id })

      const expiredPublishing = await transaction
        .update(eventModel)
        .set({
          status: 'pending',
          availableAt: now,
          reservedBy: null,
          reservationExpiresAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(eventModel.status, 'publishing'),
            lte(eventModel.reservationExpiresAt, now),
          ),
        )
        .returning({ id: eventModel.id })

      return { failed, expiredPublishing }
    })

    const recoveredIds = [
      ...result.failed.map((event) => event.id),
      ...result.expiredPublishing.map((event) => event.id),
    ]
    await this.outboxDatabase.wake(recoveredIds)

    return {
      failed: result.failed.length,
      expiredPublishing: result.expiredPublishing.length,
    }
  }
}
