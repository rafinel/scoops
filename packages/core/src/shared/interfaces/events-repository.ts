import type { Event } from '#shared/domain/events/event.ts'
import type { EventsRepositoryListener } from '#shared/interfaces/events-repository-listener.ts'
import type { OutboxEvent } from '#shared/interfaces/outbox-event.ts'

export interface EventsRepository {
  add(event: Event): Promise<void>
  subscribe(
    onEvent: (eventId: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<EventsRepositoryListener>
  reserveAvailable(now: Date, owner: string, limit: 100): Promise<OutboxEvent[]>
  releaseExpired(now: Date, owner: string): Promise<string[]>
  markPublished(eventId: string, owner: string, publishedAt: Date): Promise<boolean>
  markDeliveryFailed(input: {
    eventId: string
    owner: string
    attempts: number
    availableAt: Date
    errorCode: string
    updatedAt: Date
  }): Promise<boolean>
  recover(now: Date): Promise<{
    failed: number
    expiredPublishing: number
    recoveredIds: string[]
  }>
  deleteDeliveredBefore(cutoff: Date): Promise<number>
  findOldestAvailable(now: Date): Promise<Date | null>
  notify(eventIds: readonly string[]): Promise<void>
}
