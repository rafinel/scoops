import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { CleanupPublishedEventsJob } from '@/shared/messaging/inngest/jobs/cleanup-published-events-job'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

describe('CleanupPublishedEventsJob', () => {
  let fixture: InngestFixture
  let job: CleanupPublishedEventsJob
  const now = new Date('2026-09-02T12:00:00.000Z')
  const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  beforeAll(async () => {
    fixture = new InngestFixture({
      functionId: 'shared/outbox-cleanup-published-events',
      createJob: (client) => {
        job = new CleanupPublishedEventsJob(
          client,
          new DrizzleEventsRepository({
            requireDatabase: () => fixture.database,
          } as unknown as DrizzleClient),
          { now: () => now } as never,
        )
        return job
      },
    })
    await fixture.setup()
  })

  afterEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.teardown())

  it('deletes only published rows strictly older than the retention boundary', async () => {
    const expired = await fixture.insertOutboxEvent({
      status: 'published',
      publishedAt: new Date(boundary.getTime() - 1),
    })
    const atBoundary = await fixture.insertOutboxEvent({
      status: 'published',
      publishedAt: boundary,
    })
    const pending = await fixture.insertOutboxEvent({
      publishedAt: null,
    })
    const publishing = await fixture.insertOutboxEvent({
      status: 'publishing',
      reservedBy: 'instance:execution',
      reservationExpiresAt: new Date(now.getTime() + 60_000),
      publishedAt: null,
    })
    const failed = await fixture.insertOutboxEvent({
      status: 'failed',
      publishedAt: null,
    })
    await expect(job.cleanup(now)).resolves.toBe(1)

    const ids = (
      await fixture.database.select({ id: eventModel.id }).from(eventModel)
    ).map((row) => row.id)
    expect(ids).not.toContain(expired.id)
    expect(ids).toEqual(
      expect.arrayContaining([atBoundary.id, pending.id, publishing.id, failed.id]),
    )
  })
})
