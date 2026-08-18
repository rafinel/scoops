import type { Event } from '@scoops/core/shared/domain/events'
import type { Broker } from '@scoops/core/shared/interfaces'

export class InngestMock implements Broker {
  readonly events: Event[] = []

  publish(event: Event): Promise<void> {
    this.events.push(event)
    return Promise.resolve()
  }
}
