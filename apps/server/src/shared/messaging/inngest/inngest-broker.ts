import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'
import type { Event } from '@scoops/core/shared/domain/events'
import type { Broker } from '@scoops/core/shared/interfaces'

import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { validateOutboxEvent } from '@/shared/messaging/outbox/event-validation'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class InngestBroker implements Broker {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(DatabaseTransactionContext)
    private readonly transactionContext: DatabaseTransactionContext,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async publish(event: Event): Promise<void> {
    const payload = serializeEventPayload(event.payload)
    validateOutboxEvent(event.name, payload)
    const now = this.datetimeProvider.now()
    const database = this.transactionContext.get() ?? this.drizzleClient.requireDatabase()

    await database.insert(eventModel).values({
      id: randomUUID(),
      eventName: event.name,
      payload,
      occurredAt: now,
      availableAt: now,
      createdAt: now,
      updatedAt: now,
    })
  }
}

function serializeEventPayload(payload: unknown): Record<string, unknown> {
  try {
    const serialized = JSON.parse(JSON.stringify(payload))
    if (!serialized || typeof serialized !== 'object' || Array.isArray(serialized)) {
      throw new Error('Event payload must be an object')
    }
    return serialized as Record<string, unknown>
  } catch {
    throw new Error('Invalid outbox event')
  }
}
