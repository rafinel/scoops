import { UserProfile } from '@scoops/core/identity/domain/structures'
import { NotificationKind } from '@scoops/core/communication/domain/structures'
import type {
  NotificationAudienceProvider,
  NotificationsRepository,
} from '@scoops/core/communication/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { CreateInProductNotificationsJob } from '@/communication/messaging/inngest/jobs/create-in-product-notifications-job'

type Handler = (input: {
  event: { id?: string; name: string; data: unknown }
  step: { run: (name: string, operation: () => Promise<unknown>) => Promise<unknown> }
}) => Promise<unknown>

const ids = {
  establishmentId: '55000000-0000-4000-8000-000000000001',
  userId: '55000000-0000-4000-8000-000000000002',
  actorUserId: '55000000-0000-4000-8000-000000000003',
  productId: '55000000-0000-4000-8000-000000000004',
}
const timestamp = '2026-09-05T12:00:00.000Z'

function captureJob(
  overrides: {
    addMany?: NotificationsRepository['addMany']
    audienceProvider?: NotificationAudienceProvider
  } = {},
) {
  const addMany = overrides.addMany ?? vi.fn().mockResolvedValue(undefined)
  const notificationsRepository: NotificationsRepository = {
    addMany,
    findPage: vi.fn(),
    markRead: vi.fn(),
    removeAll: vi.fn(),
  }
  const audienceProvider =
    overrides.audienceProvider ??
    ({
      findManyActiveByEstablishment: vi
        .fn()
        .mockResolvedValue([{ userId: ids.actorUserId, profile: UserProfile.Manager }]),
    } satisfies NotificationAudienceProvider)
  const createFunction = vi.fn((_options: unknown, handler: Handler) => handler)
  const job = new CreateInProductNotificationsJob(
    { createFunction } as never,
    notificationsRepository,
    audienceProvider,
    { now: () => new Date('2026-09-05T13:00:00.000Z') },
  )
  return {
    addMany: addMany as ReturnType<typeof vi.fn>,
    createFunction,
    handler: job.function as unknown as Handler,
  }
}

function stockAlertEvent(id = 'event-stock-alert') {
  return {
    id,
    name: 'mrp/product.stock-alert-state-entered',
    data: {
      establishmentId: ids.establishmentId,
      productId: ids.productId,
      productName: 'Chocolate',
      unit: 'kg',
      state: 'below-ideal',
      availableQuantity: 2,
      idealQuantity: 10,
      occurredAt: timestamp,
    },
  } as const
}

const step = {
  run: vi.fn(async (_name: string, operation: () => Promise<unknown>) => operation()),
}

describe('CreateInProductNotificationsJob', () => {
  it('maps all five typed source events and preserves their source IDs', async () => {
    const captured = captureJob()
    const events = [
      {
        name: 'mrp/product.stock-alert-state-entered',
        data: {
          establishmentId: ids.establishmentId,
          productId: ids.productId,
          productName: 'Chocolate',
          unit: 'kg',
          state: 'below-ideal',
          availableQuantity: 2,
          idealQuantity: 10,
          occurredAt: timestamp,
        },
      },
      {
        name: 'identity/user.invitation-accepted',
        data: {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          email: 'ana@example.com',
          userName: 'Ana',
          profile: 'operator',
          occurredAt: timestamp,
        },
      },
      {
        name: 'identity/user.profile-updated',
        data: {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'ana@example.com',
          userName: 'Ana',
          previousProfile: 'operator',
          profile: 'manager',
          updatedAt: timestamp,
        },
      },
      {
        name: 'identity/user.inactivated',
        data: {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'ana@example.com',
          userName: 'Ana',
          previousStatus: 'active',
          status: 'inactive',
          updatedAt: timestamp,
        },
      },
      {
        name: 'identity/user.reactivated',
        data: {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'ana@example.com',
          userName: 'Ana',
          previousStatus: 'inactive',
          profile: 'operator',
          status: 'active',
          updatedAt: timestamp,
        },
      },
    ] as const

    for (const [index, event] of events.entries()) {
      await captured.handler({ event: { ...event, id: `event-${index}` }, step })
    }

    expect(captured.createFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'communication/create-in-product-notifications',
        retries: 5,
        concurrency: { limit: 1, key: 'event.data.establishmentId' },
      }),
      expect.any(Function),
    )
    expect(step.run).toHaveBeenCalledTimes(5)
    expect(captured.addMany).toHaveBeenCalledTimes(5)
    expect(captured.addMany.mock.calls.map(([rows]) => rows[0])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceEventId: 'event-0',
          kind: NotificationKind.StockBelowIdeal,
        }),
        expect.objectContaining({
          sourceEventId: 'event-1',
          kind: NotificationKind.UserAdded,
        }),
        expect.objectContaining({
          sourceEventId: 'event-2',
          kind: NotificationKind.UserPromoted,
        }),
        expect.objectContaining({
          sourceEventId: 'event-3',
          kind: NotificationKind.UserInactivated,
        }),
        expect.objectContaining({
          sourceEventId: 'event-4',
          kind: NotificationKind.UserReactivated,
        }),
      ]),
    )
  })

  it('rejects missing IDs or malformed data before the durable step', async () => {
    const captured = captureJob()
    step.run.mockClear()

    await expect(
      captured.handler({
        event: { name: 'identity/user.inactivated', data: {} },
        step,
      }),
    ).rejects.toThrow('Communication event id is required')
    await expect(
      captured.handler({
        event: {
          id: 'event-invalid',
          name: 'identity/user.inactivated',
          data: { establishmentId: ids.establishmentId },
        },
        step,
      }),
    ).rejects.toThrow()
    expect(step.run).not.toHaveBeenCalled()
  })

  it('preserves the source ID across duplicate deliveries for repository idempotency', async () => {
    const captured = captureJob()
    step.run.mockClear()
    const event = stockAlertEvent('duplicate-event')

    await captured.handler({ event, step })
    await captured.handler({ event, step })

    expect(captured.addMany).toHaveBeenCalledTimes(2)
    expect(captured.addMany.mock.calls.map(([rows]) => rows[0].sourceEventId)).toEqual([
      'duplicate-event',
      'duplicate-event',
    ])
  })

  it('propagates audience and repository failures through the durable step', async () => {
    const audienceError = new Error('Audience directory unavailable.')
    const audienceProvider: NotificationAudienceProvider = {
      findManyActiveByEstablishment: vi.fn().mockRejectedValue(audienceError),
    }
    const audienceFailure = captureJob({ audienceProvider })
    step.run.mockClear()

    await expect(
      audienceFailure.handler({ event: stockAlertEvent('audience-failure'), step }),
    ).rejects.toBe(audienceError)
    expect(step.run).toHaveBeenCalledTimes(1)
    expect(audienceFailure.addMany).not.toHaveBeenCalled()

    const repositoryError = new Error('Notification repository unavailable.')
    const addMany = vi.fn().mockRejectedValue(repositoryError)
    const repositoryFailure = captureJob({ addMany })
    step.run.mockClear()

    await expect(
      repositoryFailure.handler({ event: stockAlertEvent('repository-failure'), step }),
    ).rejects.toBe(repositoryError)
    expect(step.run).toHaveBeenCalledTimes(1)
    expect(addMany).toHaveBeenCalledTimes(1)
  })
})
