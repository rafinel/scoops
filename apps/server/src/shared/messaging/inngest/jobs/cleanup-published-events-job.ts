import type { EventsRepository } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const RETENTION_DAYS = 30

@Injectable()
export class CleanupPublishedEventsJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
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
    return this.eventsRepository.deleteDeliveredBefore(cutoff)
  }
}
