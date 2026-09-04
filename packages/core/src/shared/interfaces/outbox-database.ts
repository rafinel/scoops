import type { OutboxDatabaseListener } from '#shared/interfaces/outbox-database-listener.ts'
import type { OutboxEvent } from '#shared/interfaces/outbox-event.ts'

export interface OutboxDatabase {
  listen(
    onEvent: (eventId: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<OutboxDatabaseListener>
  reservePending(now: Date, owner: string, limit: 100): Promise<OutboxEvent[]>
  reclaimExpiredReservations(now: Date, owner: string): Promise<string[]>
  markPublished(eventId: string, owner: string, publishedAt: Date): Promise<boolean>
  markFailed(input: {
    eventId: string
    owner: string
    attempts: number
    availableAt: Date
    errorCode: string
    updatedAt: Date
  }): Promise<boolean>
  oldestPending(now: Date): Promise<Date | null>
  wake(eventIds: readonly string[]): Promise<void>
}
