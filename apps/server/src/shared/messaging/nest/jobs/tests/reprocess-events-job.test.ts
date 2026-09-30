import type { TelemetryProvider } from '@scoops/core/shared/interfaces'
import { randomUUID } from 'node:crypto'
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { ReprocessEventsJob } from '@/shared/messaging/nest/jobs/reprocess-events-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/sentry-telemetry-provider'

describe('Reprocess Events Job', () => {
  let fixture: RestFixture
  let originalServerAppMode: string | undefined
  let originalEmailProvider: string | undefined
  let recordJobRun: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    originalServerAppMode = process.env.SCOOPS_SERVER_APP_MODE
    originalEmailProvider = process.env.SCOOPS_EMAIL_PROVIDER
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'

    const inngestClient = {
      createFunction: vi.fn(() => ({})),
    } as unknown as InngestClient

    fixture = await RestFixture.register(
      { imports: [ScheduleModule.forRoot(), SharedMessagingModule] },
      (builder) =>
        builder
          .overrideProvider(InngestClient)
          .useValue(inngestClient)
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

  it('registers the every-minute Nest cron', () => {
    const cronJob = fixture.get(SchedulerRegistry).getCronJob(ReprocessEventsJob.ID)

    expect(cronJob).toBeDefined()
  })

  it('requeues only eligible rows and notifies the outbox broker', async () => {
    const now = fixture.get(DatetimeProvider).now()
    vi.spyOn(fixture.get(DatetimeProvider), 'now').mockReturnValue(now)
    const database = fixture.get(DrizzleClient).requireDatabase()
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

    const result = await fixture.get(ReprocessEventsJob).reprocess()
    const rows = await database.select().from(eventModel)

    expect(result).toEqual({ failed: 1, expiredPublishing: 1 })
    expect(rows.find(({ id }) => id === eligible.id)).toMatchObject({
      status: 'pending',
      attempts: 4,
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(rows.find(({ id }) => id === publishing.id)).toMatchObject({
      status: 'pending',
      reservedBy: null,
      reservationExpiresAt: null,
    })
    expect(rows.find(({ id }) => id === early.id)?.status).toBe('failed')
    expect(rows.find(({ id }) => id === terminal.id)?.status).toBe('failed')
    expect(recordJobRun).toHaveBeenCalledExactlyOnceWith({
      functionId: ReprocessEventsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(eligible.id)
  })

  it('logs telemetry errors without failing event recovery', async () => {
    const logError = vi
      .spyOn(fixture.get<TelemetryProvider>(TELEMETRY), 'logError')
      .mockImplementation(() => {})
    recordJobRun.mockImplementation(() => {
      throw new Error('telemetry unavailable')
    })

    await expect(fixture.get(ReprocessEventsJob).reprocess()).resolves.toEqual({
      failed: 0,
      expiredPublishing: 0,
    })

    expect(logError).toHaveBeenCalledExactlyOnceWith({
      signal: 'job_telemetry_failure',
      functionId: ReprocessEventsJob.ID,
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
