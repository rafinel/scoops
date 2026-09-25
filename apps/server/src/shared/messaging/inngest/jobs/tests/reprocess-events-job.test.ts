import type { Telemetry } from '@scoops/core/shared/interfaces'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'
import { SharedMessagingModuleFixture } from '@/shared/messaging/fixtures/shared-messaging-module-fixture'
import { ReprocessEventsJob } from '@/shared/messaging/inngest/jobs/reprocess-events-job'

describe('Reprocess Events Job', () => {
  let fixture: SharedMessagingModuleFixture
  let recordJobRun: ReturnType<typeof vi.spyOn>
  let captureUnexpected: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    fixture = await SharedMessagingModuleFixture.register({
      inngestJob: ReprocessEventsJob,
    })
  })

  beforeEach(async () => {
    vi.restoreAllMocks()
    await fixture.resetDatabase()
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
  })

  it('requeues only eligible rows through the test-only AppModule registration', async () => {
    const now = fixture.get(DatetimeProvider).now()
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

    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(ReprocessEventsJob.ID)
    const rows = await fixture.database.select().from(eventModel)
    expect(rows.find((row) => row.id === eligible.id)).toMatchObject({
      status: 'published',
      attempts: 4,
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(rows.find((row) => row.id === publishing.id)?.status).toBe('published')
    expect(rows.find((row) => row.id === early.id)?.status).toBe('failed')
    expect(rows.find((row) => row.id === terminal.id)?.status).toBe('failed')
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: ReprocessEventsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(eligible.id)
    expect(captureUnexpected).not.toHaveBeenCalled()
    expect(process.env.SCOOPS_SERVER_APP_MODE).toBe('test')
  })

  it('publishes an eligible recovered event after the scheduled job wakes the broker', async () => {
    const now = fixture.get(DatetimeProvider).now()
    const event = await fixture.insertOutboxEvent({
      status: 'failed',
      attempts: 2,
      availableAt: new Date(now.getTime() - 60_000),
    })

    const run = await fixture.invokeInngest()
    const rows = await fixture.database.select().from(eventModel)
    const recovered = rows.find(({ id }) => id === event.id)

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(ReprocessEventsJob.ID)
    expect(recovered).toMatchObject({
      status: 'published',
      attempts: 2,
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: ReprocessEventsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(event.id)
    expect(captureUnexpected).not.toHaveBeenCalled()
  })
})
