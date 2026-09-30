import type { TelemetryProvider } from '@scoops/core/shared/interfaces'
import { randomUUID } from 'node:crypto'
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { CleanupPublishedEventsJob } from '@/shared/messaging/nest/jobs/cleanup-published-events-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/sentry-telemetry-provider'

describe('Cleanup Published Events Job', () => {
  let fixture: RestFixture
  let originalServerAppMode: string | undefined
  let originalEmailProvider: string | undefined
  let recordJobRun: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    originalServerAppMode = process.env.SCOOPS_SERVER_APP_MODE
    originalEmailProvider = process.env.SCOOPS_EMAIL_PROVIDER
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'

    fixture = await RestFixture.register(
      { imports: [ScheduleModule.forRoot(), SharedMessagingModule] },
      (builder) =>
        builder
          .overrideProvider(InngestClient)
          .useValue({} as InngestClient)
          .overrideProvider(InngestBroker)
          .useValue({}),
    )
  })

  beforeEach(async () => {
    vi.restoreAllMocks()
    await fixture.resetDatabase()
    const telemetry = fixture.get<TelemetryProvider>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
    restoreEnvironmentVariable('SCOOPS_SERVER_APP_MODE', originalServerAppMode)
    restoreEnvironmentVariable('SCOOPS_EMAIL_PROVIDER', originalEmailProvider)
  })

  it('registers the daily Nest cron', () => {
    const cronJob = fixture
      .get(SchedulerRegistry)
      .getCronJob(CleanupPublishedEventsJob.ID)

    expect(cronJob).toBeDefined()
  })

  it('deletes only expired published rows and records a safe outcome', async () => {
    const datetimeProvider = fixture.get(DatetimeProvider)
    const now = datetimeProvider.now()
    vi.spyOn(datetimeProvider, 'now').mockReturnValue(now)
    const database = fixture.get(DrizzleClient).requireDatabase()
    const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const expired = await insertOutboxEvent(database, {
      status: 'published',
      publishedAt: new Date(boundary.getTime() - 1),
    })
    const atBoundary = await insertOutboxEvent(database, {
      status: 'published',
      publishedAt: boundary,
    })
    const pending = await insertOutboxEvent(database, { publishedAt: null })
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

    const deletedCount = await fixture.get(CleanupPublishedEventsJob).cleanup()
    const ids = (await database.select({ id: eventModel.id }).from(eventModel)).map(
      ({ id }) => id,
    )

    expect(deletedCount).toBe(1)
    expect(ids).not.toContain(expired.id)
    expect(ids).toContain(atBoundary.id)
    expect(ids).toContain(pending.id)
    expect(ids).toContain(publishing.id)
    expect(ids).toContain(failed.id)
    expect(recordJobRun).toHaveBeenCalledExactlyOnceWith({
      functionId: CleanupPublishedEventsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(expired.id)
  })

  it('reports telemetry errors without failing cleanup', async () => {
    const logError = vi
      .spyOn(fixture.get<TelemetryProvider>(TELEMETRY), 'logError')
      .mockImplementation(() => {})
    recordJobRun.mockImplementation(() => {
      throw new Error('telemetry unavailable')
    })

    await expect(fixture.get(CleanupPublishedEventsJob).cleanup()).resolves.toBe(0)

    expect(logError).toHaveBeenCalledExactlyOnceWith({
      signal: 'job_telemetry_failure',
      functionId: CleanupPublishedEventsJob.ID,
      outcome: 'failure',
      errorClass: 'Error',
    })
  })
})

async function insertOutboxEvent(
  database: ReturnType<DrizzleClient['requireDatabase']>,
  overrides: Partial<typeof eventModel.$inferInsert> = {},
) {
  const now = new Date()
  const [event] = await database
    .insert(eventModel)
    .values({
      id: randomUUID(),
      eventName: 'test/outbox-event',
      payload: { safe: true },
      occurredAt: now,
      availableAt: now,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()

  return event
}

function restoreEnvironmentVariable(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
