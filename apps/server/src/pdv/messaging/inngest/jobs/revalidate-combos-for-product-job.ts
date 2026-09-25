import { Inject, Injectable } from '@nestjs/common'
import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import type { ProductSalesConfiguration } from '@scoops/core/mrp/domain/structures'
import { RevalidateCombosForProductUseCase } from '@scoops/core/pdv/use-cases'
import { productSalesConfigurationChangedEventSchema } from '@scoops/validation'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import type { PdvDatabase } from '@scoops/core/pdv/interfaces'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

export const productSalesConfigurationChangedEvent = eventType(
  ProductSalesConfigurationChangedEvent._NAME,
  { schema: productSalesConfigurationChangedEventSchema },
)

type EventData = z.infer<typeof productSalesConfigurationChangedEventSchema>
type AvailableEventData = Extract<EventData, { state: 'available' }>

@Injectable()
export class RevalidateCombosForProductJob extends InngestJob {
  static readonly ID = 'pdv/revalidate-combos-for-product'

  readonly function: InngestFunction.Like

  private readonly useCase: RevalidateCombosForProductUseCase

  constructor(
    @Inject(InngestClient) inngest: InngestClient,
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(TELEMETRY) operationalTelemetry: Telemetry,
  ) {
    super(inngest, operationalTelemetry)
    this.useCase = new RevalidateCombosForProductUseCase(database)
    this.function = this.inngest.createFunction(
      {
        id: RevalidateCombosForProductJob.ID,
        onFailure: ({ event, error }) =>
          this.recordTerminalFailure(
            RevalidateCombosForProductJob.ID,
            event.data.run_id,
            event.data.event.ts,
            error,
          ),
        concurrency: {
          limit: 1,
          key: 'event.data.establishmentId + ":" + event.data.productId',
        },
        triggers: [productSalesConfigurationChangedEvent],
      },
      async ({ event, step, runId }) => {
        const result = await step.run('revalidate-combos', () =>
          this.useCase.execute(this.toDomainRequest(event.data)),
        )
        this.recordSuccessfulRun(RevalidateCombosForProductJob.ID, runId, event.ts)
        return result
      },
    )
  }

  private toDomainRequest(
    data: EventData,
  ): Parameters<RevalidateCombosForProductUseCase['execute']>[0] {
    if (data.state === 'deleted') return data

    return {
      ...data,
      configuration: this.toDomainConfiguration(data.configuration),
    }
  }

  private toDomainConfiguration(
    configuration: AvailableEventData['configuration'],
  ): ProductSalesConfiguration {
    return {
      ...configuration,
      updatedAt: new Date(configuration.updatedAt),
    }
  }
}
