import type { EventsRepository } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ReprocessEventsJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)
    this.function = this.inngest.createFunction(
      { id: 'shared/reprocess-events', triggers: [cron('* * * * *')] },
      async () => this.reprocess(),
    )
  }

  async reprocess(now = this.datetimeProvider.now()): Promise<{
    failed: number
    expiredPublishing: number
  }> {
    const result = await this.eventsRepository.recover(now)
    await this.eventsRepository.notify(result.recoveredIds)

    return {
      failed: result.failed,
      expiredPublishing: result.expiredPublishing,
    }
  }
}
