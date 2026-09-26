import { NotificationKind } from '@scoops/core/communication/domain/structures'
import { ProductStockAlertStateEnteredEvent } from '@scoops/core/mrp/domain/events'
import {
  UserInactivatedEvent,
  UserInvitationAcceptedEvent,
  UserProfileUpdatedEvent,
  UserReactivatedEvent,
} from '@scoops/core/identity/domain/events'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { CreateInProductNotificationsJob } from '@/communication/messaging/inngest/jobs/create-in-product-notifications-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

describe('Create In Product Notifications Job', () => {
  let fixture: CommunicationModuleFixture
  let recordJobRun: ReturnType<typeof vi.spyOn>
  let captureUnexpected: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    fixture = await CommunicationModuleFixture.register({
      inngestJob: CreateInProductNotificationsJob,
    })
  })

  beforeEach(async () => {
    vi.restoreAllMocks()
    await fixture.resetDatabase()
    await fixture.seedAccounts()
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
  })

  it('registers all source events with the established concurrency and retry policy', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: CreateInProductNotificationsJob.ID,
      retries: 5,
      concurrency: { limit: 1, key: 'event.data.establishmentId' },
    })
    expect(fixture.inngestFunctionOptions.triggers).toHaveLength(5)
  })

  it('processes all registered source events and records one safe terminal outcome each', async () => {
    const accounts = CommunicationModuleFixture.accounts
    const now = fixture.datetimeProvider.now()
    const userId = fixture.idProvider.generate()
    const actorUserId = fixture.idProvider.generate()
    const productId = fixture.idProvider.generate()
    const events = [
      new ProductStockAlertStateEnteredEvent({
        establishmentId: accounts.establishmentId,
        productId,
        productName: 'Chocolate',
        unit: 'kg',
        state: 'below-ideal',
        availableQuantity: 2,
        idealQuantity: 10,
        occurredAt: now,
      }),
      new UserInvitationAcceptedEvent({
        establishmentId: accounts.establishmentId,
        userId,
        email: 'new-user@example.com',
        userName: 'New User',
        profile: 'operator',
        occurredAt: now,
      }),
      new UserProfileUpdatedEvent({
        establishmentId: accounts.establishmentId,
        userId,
        email: 'new-user@example.com',
        userName: 'New User',
        actorUserId,
        previousProfile: 'operator',
        profile: 'manager',
        updatedAt: now,
      }),
      new UserInactivatedEvent({
        establishmentId: accounts.establishmentId,
        userId,
        email: 'new-user@example.com',
        userName: 'New User',
        actorUserId,
        previousStatus: 'active',
        status: 'inactive',
        updatedAt: now,
      }),
      new UserReactivatedEvent({
        establishmentId: accounts.establishmentId,
        userId,
        email: 'new-user@example.com',
        userName: 'New User',
        actorUserId,
        previousStatus: 'inactive',
        profile: 'operator',
        status: 'active',
        updatedAt: now,
      }),
    ]

    for (const event of events) {
      const run = await fixture.runInngest({ name: event.name, data: event.payload })
      expect(run.status.toLowerCase()).toBe('completed')
      expect(run.function?.id).toBe(CreateInProductNotificationsJob.ID)
    }

    const page = await fixture.notificationsRepository.findPage({
      establishmentId: accounts.establishmentId,
      recipientUserId: accounts.managerId,
      limit: 20,
    })
    expect(page.items.map(({ kind }) => kind)).toEqual(
      expect.arrayContaining([
        NotificationKind.StockBelowIdeal,
        NotificationKind.UserAdded,
        NotificationKind.UserPromoted,
        NotificationKind.UserInactivated,
        NotificationKind.UserReactivated,
      ]),
    )
    expect(recordJobRun).toHaveBeenCalledTimes(events.length)
    expect(recordJobRun.mock.calls).toEqual(
      Array.from({ length: events.length }, () => [
        {
          functionId: CreateInProductNotificationsJob.ID,
          outcome: 'success',
          durationMs: expect.any(Number),
        },
      ]),
    )
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(
      accounts.establishmentId,
    )
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(userId)
    expect(captureUnexpected).not.toHaveBeenCalled()
  }, 150_000)

  it('rejects malformed source data before creating notifications', async () => {
    const accounts = CommunicationModuleFixture.accounts
    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: UserInactivatedEvent._NAME,
      data: { establishmentId: 'not-a-uuid' },
    })

    expect(run.status.toLowerCase()).toBe('failed')
    const page = await fixture.notificationsRepository.findPage({
      establishmentId: accounts.establishmentId,
      recipientUserId: accounts.managerId,
      limit: 20,
    })
    expect(page.items).toHaveLength(0)
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: CreateInProductNotificationsJob.ID,
      outcome: 'failure',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(
      accounts.establishmentId,
    )
    expect(captureUnexpected).toHaveBeenCalledTimes(1)
  })

  it('preserves the source event ID for notification idempotency', async () => {
    const accounts = CommunicationModuleFixture.accounts
    const eventId = fixture.idProvider.generate()
    const event = new ProductStockAlertStateEnteredEvent({
      establishmentId: accounts.establishmentId,
      productId: fixture.idProvider.generate(),
      productName: 'Chocolate',
      unit: 'kg',
      state: 'below-ideal',
      availableQuantity: 2,
      idealQuantity: 10,
      occurredAt: fixture.datetimeProvider.now(),
    })
    const run = await fixture.runInngest({
      id: eventId,
      name: event.name,
      data: event.payload,
    })
    const page = await fixture.notificationsRepository.findPage({
      establishmentId: accounts.establishmentId,
      recipientUserId: accounts.managerId,
      limit: 20,
    })

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(CreateInProductNotificationsJob.ID)
    expect(page.items.map(({ sourceEventId }) => sourceEventId)).toEqual([eventId])
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: CreateInProductNotificationsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(captureUnexpected).not.toHaveBeenCalled()
  })
})
