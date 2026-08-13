import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Event } from '@scoops/core/shared/domain/events'
import type { Broker } from '@scoops/core/shared/interfaces'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'

@Injectable()
export class InngestBroker implements Broker {
  private readonly logger = new Logger(InngestBroker.name)

  constructor(@Inject(InngestClient) private readonly inngest: InngestClient) {}

  async publish(event: Event): Promise<void> {
    try {
      await this.inngest.send({
        name: event.name,
        data: event.payload as Record<string, unknown>,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to publish ${event.name}: ${message}`)
      throw error
    }
  }
}
