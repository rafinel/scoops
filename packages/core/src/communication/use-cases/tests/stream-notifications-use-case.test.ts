import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { NotificationFaker } from '#communication/domain/entities/fakers/index.ts'
import { NotificationActorFaker } from '#communication/domain/structures/fakers/index.ts'
import type { Notification } from '#communication/domain/entities/notification.ts'
import type { NotificationAudienceProvider } from '#communication/interfaces/notification-audience-provider.ts'
import type { NotificationRealtimeSubscriber } from '#communication/interfaces/notification-realtime-subscriber.ts'
import {
  AuthorizationError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from '#shared/domain/errors/index.ts'
import {
  StreamNotificationsUseCase,
  type StreamNotificationsRequest,
} from '#communication/use-cases/stream-notifications-use-case.ts'

type Deferred = {
  promise: Promise<void>
  resolve: () => void
}

function createDeferred(): Deferred {
  let resolve!: () => void
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

async function waitForCondition(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20 && !condition(); attempt += 1)
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Stream Notifications Use Case', () => {
  let audienceProvider: MockProxy<NotificationAudienceProvider>
  let realtimeSubscriber: MockProxy<NotificationRealtimeSubscriber>
  let useCase: StreamNotificationsUseCase
  let listeners: Array<(notification: Notification) => Promise<void> | void>
  let cleanups: Array<() => Promise<void>>

  beforeEach(() => {
    audienceProvider = mock<NotificationAudienceProvider>()
    realtimeSubscriber = mock<NotificationRealtimeSubscriber>()
    listeners = []
    cleanups = []
    realtimeSubscriber.subscribe.mockImplementation(async (listener) => {
      listeners.push(listener)
      return async () => undefined
    })
    useCase = new StreamNotificationsUseCase(realtimeSubscriber, audienceProvider)
  })

  it('delivers a newly committed notification to an eligible actor', async () => {
    const actor = NotificationActorFaker.fake()
    const notification = NotificationFaker.fake({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
    })
    const isSessionActive = vi.fn().mockResolvedValue(true)
    const notificationSink = vi.fn().mockResolvedValue(undefined)
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])

    cleanups.push(
      await useCase.execute({
        actor,
        isSessionActive,
        notificationSink,
        signal: new AbortController().signal,
      }),
    )
    await listeners[0]?.(notification)

    expect(notificationSink).toHaveBeenCalledWith(notification)
    expect(isSessionActive).toHaveBeenCalledTimes(2)
    expect(audienceProvider.findManyActiveByEstablishment).toHaveBeenCalledWith(
      actor.establishmentId,
    )
  })

  it('rejects unauthorized actors before opening a subscription', async () => {
    const actor = NotificationActorFaker.fake({ profile: 'pending' as never })

    await expect(
      useCase.execute({
        actor,
        isSessionActive: vi.fn().mockResolvedValue(true),
        notificationSink: vi.fn(),
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(realtimeSubscriber.subscribe).not.toHaveBeenCalled()
  })

  it('rejects an ineligible opening session without subscribing', async () => {
    const actor = NotificationActorFaker.fake()
    const isSessionActive = vi.fn().mockResolvedValue(false)

    await expect(
      useCase.execute({
        actor,
        isSessionActive,
        notificationSink: vi.fn(),
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(audienceProvider.findManyActiveByEstablishment).not.toHaveBeenCalled()
    expect(realtimeSubscriber.subscribe).not.toHaveBeenCalled()
  })

  it('closes when the current session is lost before a candidate', async () => {
    const actor = NotificationActorFaker.fake()
    const notification = NotificationFaker.fake({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
    })
    const isSessionActive = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    const notificationSink = vi.fn().mockResolvedValue(undefined)
    const unsubscribe = vi.fn().mockResolvedValue(undefined)
    realtimeSubscriber.subscribe.mockImplementationOnce(async (listener) => {
      listeners.push(listener)
      return unsubscribe
    })
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])

    cleanups.push(
      await useCase.execute({
        actor,
        isSessionActive,
        notificationSink,
        signal: new AbortController().signal,
      }),
    )
    await listeners[0]?.(notification)

    expect(notificationSink).not.toHaveBeenCalled()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('closes when the actor is no longer an active audience member', async () => {
    const actor = NotificationActorFaker.fake()
    const notification = NotificationFaker.fake({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
    })
    const unsubscribe = vi.fn().mockResolvedValue(undefined)
    realtimeSubscriber.subscribe.mockImplementationOnce(async (listener) => {
      listeners.push(listener)
      return unsubscribe
    })
    audienceProvider.findManyActiveByEstablishment
      .mockResolvedValueOnce([{ userId: actor.id, profile: actor.profile }])
      .mockResolvedValueOnce([])

    cleanups.push(
      await useCase.execute({
        actor,
        isSessionActive: vi.fn().mockResolvedValue(true),
        notificationSink: vi.fn().mockResolvedValue(undefined),
        signal: new AbortController().signal,
      }),
    )
    await listeners[0]?.(notification)

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('filters candidates by both recipient and establishment', async () => {
    const actor = NotificationActorFaker.fake()
    const foreignRecipient = NotificationFaker.fake({
      establishmentId: actor.establishmentId,
    })
    const foreignEstablishment = NotificationFaker.fake({
      recipientUserId: actor.id,
    })
    const notificationSink = vi.fn().mockResolvedValue(undefined)
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])

    cleanups.push(
      await useCase.execute({
        actor,
        isSessionActive: vi.fn().mockResolvedValue(true),
        notificationSink,
        signal: new AbortController().signal,
      }),
    )
    await listeners[0]?.(foreignRecipient)

    expect(notificationSink).not.toHaveBeenCalled()
    expect(realtimeSubscriber.subscribe).toHaveBeenCalledOnce()

    const secondCleanup = await useCase.execute({
      actor: NotificationActorFaker.fake({
        id: actor.id,
        establishmentId: actor.establishmentId,
      }),
      isSessionActive: vi.fn().mockResolvedValue(true),
      notificationSink,
      signal: new AbortController().signal,
    })
    cleanups.push(secondCleanup)
    await listeners[1]?.(foreignEstablishment)
    expect(notificationSink).not.toHaveBeenCalled()
  })

  it('limits an actor to five active subscriptions and releases capacity on cleanup', async () => {
    const actor = NotificationActorFaker.fake()
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])
    const request = (signal: AbortSignal): StreamNotificationsRequest => ({
      actor,
      isSessionActive: vi.fn().mockResolvedValue(true),
      notificationSink: vi.fn().mockResolvedValue(undefined),
      signal,
    })

    for (let index = 0; index < 5; index += 1)
      cleanups.push(await useCase.execute(request(new AbortController().signal)))

    await expect(
      useCase.execute(request(new AbortController().signal)),
    ).rejects.toBeInstanceOf(TooManyRequestsError)

    await cleanups[0]?.()
    cleanups.push(await useCase.execute(request(new AbortController().signal)))
    expect(realtimeSubscriber.subscribe).toHaveBeenCalledTimes(6)
  })

  it('serializes sink delivery in FIFO order and clears queued items on overflow', async () => {
    const actor = NotificationActorFaker.fake()
    const firstSink = createDeferred()
    const overflowSink = createDeferred()
    const delivered: string[] = []
    const notificationSink = vi.fn(async (notification: Notification) => {
      delivered.push(notification.id)
      if (delivered.length === 1) await firstSink.promise
      if (delivered.length === 3) await overflowSink.promise
    })
    const unsubscribe = vi.fn().mockResolvedValue(undefined)
    realtimeSubscriber.subscribe.mockImplementationOnce(async (listener) => {
      listeners.push(listener)
      return unsubscribe
    })
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])
    const cleanup = await useCase.execute({
      actor,
      isSessionActive: vi.fn().mockResolvedValue(true),
      notificationSink,
      signal: new AbortController().signal,
    })
    cleanups.push(cleanup)
    const notifications = NotificationFaker.fakeMany(2).map((notification) => ({
      ...notification,
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
    }))

    await listeners[0]?.(notifications[0])
    await listeners[0]?.(notifications[1])
    expect(delivered).toEqual([notifications[0]?.id])

    firstSink.resolve()
    await waitForCondition(() => delivered.length === 2)
    expect(delivered).toEqual([notifications[0]?.id, notifications[1]?.id])

    await listeners[0]?.(
      NotificationFaker.fake({
        establishmentId: actor.establishmentId,
        recipientUserId: actor.id,
      }),
    )
    await waitForCondition(() => delivered.length === 3)

    const overflowingNotifications = NotificationFaker.fakeMany(101).map(
      (notification) => ({
        ...notification,
        establishmentId: actor.establishmentId,
        recipientUserId: actor.id,
      }),
    )
    await Promise.all(
      overflowingNotifications.map((notification) => listeners[0]?.(notification)),
    )
    expect(unsubscribe).toHaveBeenCalledOnce()
    overflowSink.resolve()
  })

  it('cleans up on cancellation and makes cleanup idempotent', async () => {
    const actor = NotificationActorFaker.fake()
    const abortController = new AbortController()
    const unsubscribe = vi.fn().mockResolvedValue(undefined)
    realtimeSubscriber.subscribe.mockImplementationOnce(async (listener) => {
      listeners.push(listener)
      return unsubscribe
    })
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])
    const cleanup = await useCase.execute({
      actor,
      isSessionActive: vi.fn().mockResolvedValue(true),
      notificationSink: vi.fn().mockResolvedValue(undefined),
      signal: abortController.signal,
    })

    abortController.abort()
    await Promise.all([cleanup(), cleanup()])

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('translates subscription failures and releases reserved capacity', async () => {
    const actor = NotificationActorFaker.fake()
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: actor.id, profile: actor.profile },
    ])
    realtimeSubscriber.subscribe.mockRejectedValueOnce(new Error('connection failed'))

    await expect(
      useCase.execute({
        actor,
        isSessionActive: vi.fn().mockResolvedValue(true),
        notificationSink: vi.fn(),
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError)

    realtimeSubscriber.subscribe.mockResolvedValueOnce(async () => undefined)
    await expect(
      useCase.execute({
        actor,
        isSessionActive: vi.fn().mockResolvedValue(true),
        notificationSink: vi.fn(),
        signal: new AbortController().signal,
      }),
    ).resolves.toBeTypeOf('function')
  })
})
