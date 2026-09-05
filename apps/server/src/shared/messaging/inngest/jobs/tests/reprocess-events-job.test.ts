import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ReprocessEventsJob } from '@/shared/messaging/inngest/jobs/reprocess-events-job'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'

describe('ReprocessEventsJob', () => {
  let fixture: InngestFixture
  let job: ReprocessEventsJob
  let notify: ReturnType<typeof vi.fn>
  const now = new Date('2026-09-02T12:00:00.000Z')

  beforeAll(async () => {
    notify = vi.fn()
    fixture = new InngestFixture({
      functionId: 'shared/reprocess-events',
      createJob: (client) => {
        const eventsRepository = new DrizzleEventsRepository({
          requireDatabase: () => fixture.database,
          notify,
        } as unknown as DrizzleClient)
        job = new ReprocessEventsJob(client, eventsRepository, {
          now: () => now,
        } as never)
        return job
      },
    })
    await fixture.setup()
  })

  afterEach(async () => {
    await fixture.resetDatabase()
    notify.mockClear()
  })
  afterAll(async () => fixture.teardown())

  it('requeues eligible failures and expired reservations without inflating attempts', async () => {
    const eligible = await fixture.insertOutboxEvent({
      status: 'failed',
      attempts: 4,
      availableAt: new Date(now.getTime() - 60_000),
    })
    const early = await fixture.insertOutboxEvent({
      status: 'failed',
      attempts: 4,
      availableAt: new Date(now.getTime() + 60_000),
    })
    const terminal = await fixture.insertOutboxEvent({
      status: 'failed',
      attempts: 10,
      availableAt: new Date(now.getTime() - 60_000),
    })
    const publishing = await fixture.insertOutboxEvent({
      status: 'publishing',
      reservedBy: 'instance:execution',
      reservationExpiresAt: new Date(now.getTime() - 60_000),
    })
    await expect(job.reprocess(now)).resolves.toEqual({ failed: 1, expiredPublishing: 1 })

    const rows = await fixture.database.select().from(eventModel)
    expect(rows.find((row) => row.id === eligible.id)).toMatchObject({
      status: 'pending',
      attempts: 4,
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(rows.find((row) => row.id === publishing.id)?.status).toBe('pending')
    expect(rows.find((row) => row.id === early.id)?.status).toBe('failed')
    expect(rows.find((row) => row.id === terminal.id)?.status).toBe('failed')
    expect(notify).toHaveBeenCalledWith('scoops_events', eligible.id)
    expect(notify).toHaveBeenCalledWith('scoops_events', publishing.id)
  })

  it('wakes the publisher after recovering eligible rows', async () => {
    const failed = await fixture.insertOutboxEvent({
      status: 'failed',
      attempts: 1,
      availableAt: new Date(now.getTime() - 60_000),
    })
    await job.reprocess(now)

    expect(notify).toHaveBeenCalledWith('scoops_events', failed.id)
  })
})
