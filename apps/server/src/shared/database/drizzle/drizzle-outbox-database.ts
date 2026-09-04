import { and, asc, eq, inArray, lte } from 'drizzle-orm'
import type {
  OutboxDatabase,
  OutboxDatabaseListener,
  OutboxEvent,
} from '@scoops/core/shared/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

const EVENTS_CHANNEL = 'scoops_events'
const MAX_RESERVATION_BATCH_SIZE = 100
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

@Injectable()
export class DrizzleOutboxDatabase implements OutboxDatabase {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  async listen(
    onEvent: (eventId: string) => void,
    onReady: () => void,
    onError: (error: unknown) => void,
  ): Promise<OutboxDatabaseListener> {
    const listener = await this.drizzleClient.listen(
      EVENTS_CHANNEL,
      (payload) => {
        if (UUID_PATTERN.test(payload)) onEvent(payload)
      },
      onReady,
      onError,
    )

    return {
      unlisten: () => listener.unlisten(),
    }
  }

  async reservePending(now: Date, owner: string, _limit: 100): Promise<OutboxEvent[]> {
    const reservationExpiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    const database = this.drizzleClient.requireDatabase()

    return database.transaction(async (transaction) => {
      const events = await transaction
        .select({
          id: eventModel.id,
          eventName: eventModel.eventName,
          payload: eventModel.payload,
          attempts: eventModel.attempts,
          reservedBy: eventModel.reservedBy,
          reservationExpiresAt: eventModel.reservationExpiresAt,
        })
        .from(eventModel)
        .where(and(eq(eventModel.status, 'pending'), lte(eventModel.availableAt, now)))
        .orderBy(asc(eventModel.availableAt), asc(eventModel.createdAt))
        .limit(MAX_RESERVATION_BATCH_SIZE)
        .for('update', { skipLocked: true })

      if (events.length === 0) return []

      await transaction
        .update(eventModel)
        .set({
          status: 'publishing',
          reservedBy: owner,
          reservationExpiresAt,
          updatedAt: now,
        })
        .where(
          and(
            inArray(
              eventModel.id,
              events.map((event) => event.id),
            ),
            eq(eventModel.status, 'pending'),
          ),
        )

      return events.map((event) => ({
        ...event,
        reservedBy: owner,
        reservationExpiresAt,
      }))
    })
  }

  async reclaimExpiredReservations(now: Date, _owner: string): Promise<string[]> {
    const reclaimed = await this.drizzleClient
      .requireDatabase()
      .update(eventModel)
      .set({
        status: 'pending',
        availableAt: now,
        reservedBy: null,
        reservationExpiresAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(eventModel.status, 'publishing'),
          lte(eventModel.reservationExpiresAt, now),
        ),
      )
      .returning({ id: eventModel.id })

    return reclaimed.map((event) => event.id)
  }

  async markPublished(
    eventId: string,
    owner: string,
    publishedAt: Date,
  ): Promise<boolean> {
    const updated = await this.drizzleClient
      .requireDatabase()
      .update(eventModel)
      .set({
        status: 'published',
        publishedAt,
        reservedBy: null,
        reservationExpiresAt: null,
        lastErrorCode: null,
        updatedAt: publishedAt,
      })
      .where(
        and(
          eq(eventModel.id, eventId),
          eq(eventModel.status, 'publishing'),
          eq(eventModel.reservedBy, owner),
        ),
      )
      .returning({ id: eventModel.id })

    return updated.length === 1
  }

  async markFailed(input: {
    eventId: string
    owner: string
    attempts: number
    availableAt: Date
    errorCode: string
    updatedAt: Date
  }): Promise<boolean> {
    const updated = await this.drizzleClient
      .requireDatabase()
      .update(eventModel)
      .set({
        status: 'failed',
        attempts: input.attempts,
        availableAt: input.availableAt,
        reservedBy: null,
        reservationExpiresAt: null,
        lastErrorCode: input.errorCode,
        updatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(eventModel.id, input.eventId),
          eq(eventModel.status, 'publishing'),
          eq(eventModel.reservedBy, input.owner),
        ),
      )
      .returning({ id: eventModel.id })

    return updated.length === 1
  }

  async oldestPending(now: Date): Promise<Date | null> {
    const [event] = await this.drizzleClient
      .requireDatabase()
      .select({ createdAt: eventModel.createdAt })
      .from(eventModel)
      .where(and(eq(eventModel.status, 'pending'), lte(eventModel.availableAt, now)))
      .orderBy(asc(eventModel.createdAt))
      .limit(1)

    return event?.createdAt ?? null
  }

  async wake(eventIds: readonly string[]): Promise<void> {
    await Promise.all(
      eventIds
        .filter((eventId) => UUID_PATTERN.test(eventId))
        .map((eventId) => this.drizzleClient.notify(EVENTS_CHANNEL, eventId)),
    )
  }
}
