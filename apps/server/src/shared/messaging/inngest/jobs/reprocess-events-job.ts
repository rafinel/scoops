import type { EventsRepository } from '@scoops/core/shared/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { cron, type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

@Injectable()
export class ReprocessEventsJob extends InngestJob {
  static readonly ID = 'shared/reprocess-events'

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
        id: ReprocessEventsJob.ID,
        triggers: [cron('* * * * *')],
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            ReprocessEventsJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
      },
      async ({ event, runId }) => {
        const result = await this.reprocess()
        this.recordSuccessfulRun(ReprocessEventsJob.ID, runId, event.ts)
        return result
      },
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
