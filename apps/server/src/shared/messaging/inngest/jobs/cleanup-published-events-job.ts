import type { EventsRepository } from '@scoops/core/shared/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

const RETENTION_DAYS = 30

@Injectable()
export class CleanupPublishedEventsJob extends InngestJob {
  static readonly ID = 'shared/outbox-cleanup-published-events'

  readonly function: InngestFunction.Like

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)
    this.function = this.inngest.createFunction(
      {
        id: CleanupPublishedEventsJob.ID,
        triggers: [cron('0 3 * * *')],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            CleanupPublishedEventsJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, runId }) => {
        const result = await this.cleanup()
        this.recordSuccessfulRun(CleanupPublishedEventsJob.ID, runId, event.ts)
        return result
      },
    )
  }

  async cleanup(now = this.datetimeProvider.now()): Promise<number> {
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    return this.eventsRepository.deleteDeliveredBefore(cutoff)
  }
}
