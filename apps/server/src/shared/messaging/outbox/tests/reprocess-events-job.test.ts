import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ReprocessEventsJob } from '@/shared/messaging/outbox/reprocess-events-job'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import {
  insertOutboxEvent,
  openOutboxDatabase,
  type OutboxTestDatabase,
} from '@/shared/messaging/outbox/outbox-test-support'

describe('ReprocessEventsJob', () => {
  let database: OutboxTestDatabase
  let reset: () => Promise<void>
  let close: () => Promise<void>
  const now = new Date('2026-09-02T12:00:00.000Z')

  beforeAll(async () => {
    const opened = await openOutboxDatabase()
    database = opened.database
    reset = opened.reset
    close = opened.close
  })

  afterEach(async () => reset())
  afterAll(async () => close())

  it('requeues eligible failures and expired reservations without inflating attempts', async () => {
    const eligible = await insertOutboxEvent(database, {
      status: 'failed',
      attempts: 4,
      availableAt: new Date(now.getTime() - 60_000),
    })
    const early = await insertOutboxEvent(database, {
      status: 'failed',
      attempts: 4,
      availableAt: new Date(now.getTime() + 60_000),
    })
    const terminal = await insertOutboxEvent(database, {
      status: 'failed',
      attempts: 10,
      availableAt: new Date(now.getTime() - 60_000),
    })
    const publishing = await insertOutboxEvent(database, {
      status: 'publishing',
      reservedBy: 'instance:execution',
      reservationExpiresAt: new Date(now.getTime() - 60_000),
    })
    const wake = vi.fn()
    const job = new ReprocessEventsJob(
      { createFunction: vi.fn(() => ({})) } as unknown as InngestClient,
      { requireDatabase: () => database } as unknown as DrizzleClient,
      { wake } as never,
      { now: () => now } as never,
    )

    await expect(job.reprocess(now)).resolves.toEqual({ failed: 1, expiredPublishing: 1 })

    const rows = await database.select().from(eventModel)
    expect(rows.find((row) => row.id === eligible.id)).toMatchObject({
      status: 'pending',
      attempts: 4,
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(rows.find((row) => row.id === publishing.id)?.status).toBe('pending')
    expect(rows.find((row) => row.id === early.id)?.status).toBe('failed')
    expect(rows.find((row) => row.id === terminal.id)?.status).toBe('failed')
    expect(wake).toHaveBeenCalledWith([eligible.id, publishing.id])
  })

  it('wakes the publisher after recovering eligible rows', async () => {
    const failed = await insertOutboxEvent(database, {
      status: 'failed',
      attempts: 1,
      availableAt: new Date(now.getTime() - 60_000),
    })
    const wake = vi.fn()
    const job = new ReprocessEventsJob(
      { createFunction: vi.fn(() => ({})) } as unknown as InngestClient,
      { requireDatabase: () => database } as unknown as DrizzleClient,
      { wake } as never,
      { now: () => now } as never,
    )

    await job.reprocess(now)

    expect(wake).toHaveBeenCalledWith([failed.id])
  })
})
