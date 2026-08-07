import type { Event } from '#shared/domain/events/index.ts'

export interface Broker {
  publish(event: Event): void
}
