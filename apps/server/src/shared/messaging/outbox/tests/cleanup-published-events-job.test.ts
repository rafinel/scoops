import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { CleanupPublishedEventsJob } from '@/shared/messaging/outbox/cleanup-published-events-job'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import {
  insertOutboxEvent,
  openOutboxDatabase,
  type OutboxTestDatabase,
} from '@/shared/messaging/outbox/outbox-test-support'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

describe('CleanupPublishedEventsJob', () => {
  let database: OutboxTestDatabase
  let reset: () => Promise<void>
  let close: () => Promise<void>
  const now = new Date('2026-09-02T12:00:00.000Z')
  const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  beforeAll(async () => {
    const opened = await openOutboxDatabase()
    database = opened.database
    reset = opened.reset
    close = opened.close
  })

  afterEach(async () => reset())
  afterAll(async () => close())

  it('deletes only published rows strictly older than the retention boundary', async () => {
    const expired = await insertOutboxEvent(database, {
      status: 'published',
      publishedAt: new Date(boundary.getTime() - 1),
    })
    const atBoundary = await insertOutboxEvent(database, {
      status: 'published',
      publishedAt: boundary,
    })
    const pending = await insertOutboxEvent(database, {
      publishedAt: null,
    })
    const publishing = await insertOutboxEvent(database, {
      status: 'publishing',
      reservedBy: 'instance:execution',
      reservationExpiresAt: new Date(now.getTime() + 60_000),
      publishedAt: null,
    })
    const failed = await insertOutboxEvent(database, {
      status: 'failed',
      publishedAt: null,
    })
    const job = new CleanupPublishedEventsJob(
      { createFunction: () => ({}) } as unknown as InngestClient,
      { requireDatabase: () => database } as unknown as DrizzleClient,
      { now: () => now } as never,
    )

    await expect(job.cleanup(now)).resolves.toBe(1)

    const ids = (await database.select({ id: eventModel.id }).from(eventModel)).map(
      (row) => row.id,
    )
    expect(ids).not.toContain(expired.id)
    expect(ids).toEqual(
      expect.arrayContaining([atBoundary.id, pending.id, publishing.id, failed.id]),
    )
  })
})
