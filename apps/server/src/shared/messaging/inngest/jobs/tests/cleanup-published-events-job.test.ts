import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CleanupPublishedEventsJob } from '@/shared/messaging/inngest/jobs/cleanup-published-events-job'
import { SharedMessagingModuleFixture } from '@/shared/messaging/fixtures/shared-messaging-module-fixture'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

describe('Cleanup Published Events Job', () => {
  let fixture: SharedMessagingModuleFixture
  let recordJobRun: ReturnType<typeof vi.spyOn>
  let captureUnexpected: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    fixture = await SharedMessagingModuleFixture.register({
      inngestJob: CleanupPublishedEventsJob,
    })
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
  })

  it('deletes only expired published rows and records one safe terminal outcome', async () => {
    const datetimeProvider = fixture.get(DatetimeProvider)
    const now = datetimeProvider.now()
    vi.spyOn(datetimeProvider, 'now').mockReturnValue(now)
    const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const expired = await fixture.insertOutboxEvent({
      status: 'published',
      publishedAt: new Date(boundary.getTime() - 1),
    })
    const atBoundary = await fixture.insertOutboxEvent({
      status: 'published',
      publishedAt: boundary,
    })
    const pending = await fixture.insertOutboxEvent({ publishedAt: null })
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

    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(CleanupPublishedEventsJob.ID)
    const ids = (
      await fixture.database.select({ id: eventModel.id }).from(eventModel)
    ).map((row) => row.id)
    expect(ids).not.toContain(expired.id)
    expect(ids).toContain(atBoundary.id)
    expect(ids).toContain(pending.id)
    expect(ids).toContain(publishing.id)
    expect(ids).toContain(failed.id)
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: CleanupPublishedEventsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(expired.id)
    expect(captureUnexpected).not.toHaveBeenCalled()
  })
})
