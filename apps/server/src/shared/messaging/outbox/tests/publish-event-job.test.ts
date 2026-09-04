import { describe, expect, it, vi } from 'vitest'
import { Logger } from '@nestjs/common'
import type { OutboxDatabase, OutboxEvent } from '@scoops/core/shared/interfaces'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { PublishEventJob } from '@/shared/messaging/outbox/publish-event-job'

const now = new Date('2026-09-03T12:00:00.000Z')

function makeEvent(index: number, attempts = 0): OutboxEvent {
  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    eventName: 'identity/onboarding-confirmation.prepared',
    payload: {
      userId: '00000000-0000-4000-8000-000000000001',
      email: 'test@example.com',
      name: 'Test User',
      actionUrl: 'http://localhost:4000/confirm?token=test',
      expiresAt: '2026-09-09T12:00:00.000Z',
      occurredAt: '2026-09-03T12:00:00.000Z',
    },
    attempts,
    reservedBy: null,
    reservationExpiresAt: null,
  }
}

function makeOutbox(
  events: OutboxEvent[],
  oldestPending: Date | null = null,
  connectImmediately = true,
) {
  const pendingEventIds = new Set(events.map((event) => event.id))
  let onEvent: ((eventId: string) => void) | undefined
  let onReady: (() => void) | undefined
  let onError: ((error: unknown) => void) | undefined
  let unlistenCount = 0
  const failedCalls: Array<{ errorCode: string; attempts: number }> = []

  const database: OutboxDatabase = {
    listen: async (eventHandler, readyHandler, errorHandler) => {
      onEvent = eventHandler
      onReady = readyHandler
      onError = errorHandler
      if (connectImmediately) readyHandler()
      return {
        unlisten: async () => {
          unlistenCount += 1
        },
      }
    },
    reservePending: async (_date, owner, _limit) => {
      const reserved = events
        .filter((event) => pendingEventIds.has(event.id) && event.reservedBy === null)
        .slice(0, 100)
        .map((event) => {
          event.reservedBy = owner
          event.reservationExpiresAt = new Date(now.getTime() + 300_000)
          return event
        })
      return reserved
    },
    reclaimExpiredReservations: async () => [],
    markPublished: async (eventId, owner) => {
      const event = events.find((candidate) => candidate.id === eventId)
      if (!event || event.reservedBy !== owner) return false
      pendingEventIds.delete(event.id)
      event.reservedBy = null
      event.reservationExpiresAt = null
      return true
    },
    markFailed: async ({ eventId, owner, attempts, errorCode }) => {
      failedCalls.push({ errorCode, attempts })
      const event = events.find((candidate) => candidate.id === eventId)
      if (!event || event.reservedBy !== owner) return false
      pendingEventIds.delete(event.id)
      event.attempts = attempts
      event.reservedBy = null
      event.reservationExpiresAt = null
      return true
    },
    oldestPending: async () => oldestPending,
    wake: async () => undefined,
  }

  return {
    database,
    notify(eventId: string) {
      onEvent?.(eventId)
    },
    reconnect() {
      onReady?.()
    },
    error(error: unknown) {
      onError?.(error)
    },
    getUnlistenCount() {
      return unlistenCount
    },
    getFailedCalls() {
      return failedCalls
    },
  }
}

function makeJob(outbox: OutboxDatabase, send = vi.fn().mockResolvedValue(undefined)) {
  return {
    job: new PublishEventJob({ send } as unknown as InngestClient, outbox, {
      now: () => now,
    } as never),
    send,
  }
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('PublishEventJob', () => {
  it('drains on startup, notification and reconnect, with a bounded direct publication', async () => {
    const events = Array.from({ length: 101 }, (_, index) => makeEvent(index))
    const outbox = makeOutbox(events)
    const { job, send } = makeJob(outbox.database)

    await job.onModuleInit()
    await flush()

    expect(send).toHaveBeenCalledTimes(100)
    expect(new Set(send.mock.calls.map(([input]) => input.id))).toHaveLength(100)
    expect(send.mock.calls[0]?.[0]).toMatchObject({ id: events[0].id })

    outbox.notify(events[100].id)
    await flush()
    expect(send).toHaveBeenCalledTimes(101)

    outbox.reconnect()
    await flush()
    expect(send).toHaveBeenCalledTimes(101)

    await job.onModuleDestroy()
    expect(outbox.getUnlistenCount()).toBe(1)
  })

  it('records bounded backoff and terminal failure without invoking Broker', async () => {
    const event = makeEvent(0, 9)
    const outbox = makeOutbox([event])
    const send = vi.fn().mockRejectedValue(new Error('sensitive provider response'))
    const { job } = makeJob(outbox.database, send)

    await job.onModuleInit()
    await flush()

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ id: event.id }))
    expect(event.attempts).toBe(10)
    expect(event.reservedBy).toBeNull()
  })

  it('records invalid prepared-event payloads with a safe validation error', async () => {
    const event = makeEvent(0)
    event.payload = { email: 'not-a-complete-event' }
    const outbox = makeOutbox([event])
    const { job } = makeJob(outbox.database)

    await job.onModuleInit()
    await flush()

    expect(outbox.getFailedCalls()).toEqual([{ errorCode: 'invalid_event', attempts: 1 }])
    expect(event.reservedBy).toBeNull()
  })

  it('signals an aged pending backlog without logging event data', async () => {
    const event = makeEvent(0)
    const outbox = makeOutbox([event], new Date(now.getTime() - 6 * 60_000))
    const warning = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    const { job } = makeJob(outbox.database)

    await job.onModuleInit()
    await flush()

    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('outbox_pending_backlog'),
    )
    expect(warning.mock.calls[0]?.[0]).not.toContain('test@example.com')
    warning.mockRestore()
  })

  it('starts draining before the listener ready callback and redacts listener errors', async () => {
    const outbox = makeOutbox([makeEvent(0)], null, false)
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    const { job, send } = makeJob(outbox.database)

    await job.onModuleInit()
    await flush()
    outbox.error(new Error('sensitive listener failure'))
    await job.onModuleDestroy()

    expect(send).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('outbox_listener_error'))
    expect(error.mock.calls[0]?.[0]).not.toContain('sensitive listener failure')
    error.mockRestore()
  })
})
