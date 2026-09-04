import { and, eq, lt } from 'drizzle-orm'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const RETENTION_DAYS = 30

@Injectable()
export class CleanupPublishedEventsJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)
    this.function = this.inngest.createFunction(
      { id: 'shared/outbox-cleanup-published-events', triggers: [cron('0 3 * * *')] },
      async () => this.cleanup(),
    )
  }

  async cleanup(now = this.datetimeProvider.now()): Promise<number> {
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const deleted = await this.drizzleClient
      .requireDatabase()
      .delete(eventModel)
      .where(and(eq(eventModel.status, 'published'), lt(eventModel.publishedAt, cutoff)))
      .returning({ id: eventModel.id })

    return deleted.length
  }
}
