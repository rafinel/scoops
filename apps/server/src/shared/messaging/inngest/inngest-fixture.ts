import { Inngest } from 'inngest'

import type { Event } from '@scoops/core/shared/domain/events'

type InngestFixtureOptions = {
  baseUrl?: string
  eventKey?: string
}

export class InngestFixture {
  readonly client: Inngest
  private readonly baseUrl: string

  constructor(options: InngestFixtureOptions = {}) {
    this.baseUrl =
      options.baseUrl ?? process.env.INNGEST_BASE_URL ?? 'http://127.0.0.1:8298'

    this.client = new Inngest({
      id: 'scoops-server-tests',
      isDev: true,
      baseUrl: this.baseUrl,
      eventKey: options.eventKey ?? process.env.INNGEST_EVENT_KEY,
    })
  }

  async publish(event: Event) {
    await this.client.send({
      name: event.name,
      data: event.payload as Record<string, unknown>,
    })
  }

  async waitForAvailability() {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error(
        `Inngest service is unavailable at ${this.baseUrl} (${response.status}).`,
      )
    }
  }
}
