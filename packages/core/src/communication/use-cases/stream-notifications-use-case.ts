import type { Notification } from '#communication/domain/entities/notification.ts'
import {
  NotificationActorProfile,
  type NotificationActor,
} from '#communication/domain/structures/notification-actor.ts'
import type { NotificationAudienceProvider } from '#communication/interfaces/notification-audience-provider.ts'
import type { NotificationRealtimeSubscriber } from '#communication/interfaces/notification-realtime-subscriber.ts'
import {
  AppError,
  AuthorizationError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

const MAX_ACTIVE_SUBSCRIPTIONS = 5
const MAX_QUEUE_SIZE = 100

type StreamNotificationsState = {
  readonly abortHandler: () => void
  readonly request: StreamNotificationsRequest
  candidateTail: Promise<void>
  cleanupPromise?: Promise<void>
  isClosed: boolean
  isDraining: boolean
  isReserved: boolean
  notifications: Notification[]
  unsubscribe?: () => Promise<void>
}

export type StreamNotificationsRequest = {
  readonly actor: NotificationActor
  readonly isSessionActive: () => Promise<boolean>
  readonly notificationSink: (notification: Notification) => Promise<void> | void
  readonly signal: AbortSignal
}

export class StreamNotificationsUseCase
  implements UseCase<StreamNotificationsRequest, () => Promise<void>>
{
  private static readonly activeSubscriptions = new Map<string, number>()

  constructor(
    private readonly realtimeSubscriber: NotificationRealtimeSubscriber,
    private readonly audienceProvider: NotificationAudienceProvider,
  ) {}

  async execute(request: StreamNotificationsRequest): Promise<() => Promise<void>> {
    this.validateActor(request.actor)

    const state: StreamNotificationsState = {
      abortHandler: () => void this.cleanup(state),
      request,
      candidateTail: Promise.resolve(),
      isClosed: false,
      isDraining: false,
      isReserved: false,
      notifications: [],
    }

    this.reserveSubscription(state)
    request.signal.addEventListener('abort', state.abortHandler, { once: true })

    try {
      if (request.signal.aborted) {
        await this.cleanup(state)
        return () => this.cleanup(state)
      }

      await this.ensureOpeningEligibility(request)
      if (request.signal.aborted) {
        await this.cleanup(state)
        return () => this.cleanup(state)
      }

      const unsubscribe = await this.realtimeSubscriber.subscribe((notification) =>
        this.handleCandidate(state, notification),
      )

      if (state.isClosed) {
        await this.disposeSubscription(unsubscribe)
      } else {
        state.unsubscribe = unsubscribe
      }
    } catch (error) {
      await this.cleanup(state)
      if (error instanceof AppError) throw error
      throw new ServiceUnavailableError(
        'O fluxo de notificações está indisponível no momento.',
      )
    }

    return () => this.cleanup(state)
  }

  private async ensureOpeningEligibility(
    request: StreamNotificationsRequest,
  ): Promise<void> {
    if (!(await this.isEligible(request)))
      throw new AuthorizationError(
        'A sessão não está autorizada a receber notificações em tempo real.',
      )
  }

  private async handleCandidate(
    state: StreamNotificationsState,
    notification: Notification,
  ): Promise<void> {
    const candidate = state.candidateTail.then(async () => {
      if (state.isClosed) return

      try {
        if (!(await this.isEligible(state.request, notification))) {
          await this.cleanup(state)
          return
        }

        await this.enqueue(state, notification)
      } catch {
        await this.cleanup(state)
      }
    })

    state.candidateTail = candidate.catch(() => undefined)
    await candidate
  }

  private async isEligible(
    request: StreamNotificationsRequest,
    notification?: Notification,
  ): Promise<boolean> {
    if (!(await request.isSessionActive())) return false

    const audience = await this.audienceProvider.findManyActiveByEstablishment(
      request.actor.establishmentId,
    )
    const actorIsActiveAudienceMember = audience.some(
      (member) =>
        member.userId === request.actor.id && member.profile === request.actor.profile,
    )
    if (!actorIsActiveAudienceMember) return false

    return (
      notification === undefined ||
      (notification.recipientUserId === request.actor.id &&
        notification.establishmentId === request.actor.establishmentId)
    )
  }

  private async enqueue(
    state: StreamNotificationsState,
    notification: Notification,
  ): Promise<void> {
    if (state.isClosed) return

    if (state.notifications.length >= MAX_QUEUE_SIZE) {
      await this.cleanup(state)
      return
    }

    state.notifications.push(notification)
    void this.drain(state)
  }

  private async drain(state: StreamNotificationsState): Promise<void> {
    if (state.isDraining) return
    state.isDraining = true

    try {
      while (!state.isClosed && state.notifications.length > 0) {
        const notification = state.notifications.shift()
        if (notification === undefined) continue
        await state.request.notificationSink(notification)
      }
    } catch {
      await this.cleanup(state)
    } finally {
      state.isDraining = false
      if (!state.isClosed && state.notifications.length > 0) void this.drain(state)
    }
  }

  private reserveSubscription(state: StreamNotificationsState): void {
    const key = this.getSubscriptionKey(state.request.actor)
    const activeSubscriptions =
      StreamNotificationsUseCase.activeSubscriptions.get(key) ?? 0

    if (activeSubscriptions >= MAX_ACTIVE_SUBSCRIPTIONS)
      throw new TooManyRequestsError(
        'O limite de conexões de notificações em tempo real foi atingido.',
      )

    StreamNotificationsUseCase.activeSubscriptions.set(key, activeSubscriptions + 1)
    state.isReserved = true
  }

  private async cleanup(state: StreamNotificationsState): Promise<void> {
    if (state.cleanupPromise) return state.cleanupPromise

    state.isClosed = true
    state.notifications.length = 0
    state.request.signal.removeEventListener('abort', state.abortHandler)
    this.releaseSubscription(state)

    const unsubscribe = state.unsubscribe
    state.unsubscribe = undefined
    state.cleanupPromise = unsubscribe
      ? this.disposeSubscription(unsubscribe)
      : Promise.resolve()

    return state.cleanupPromise
  }

  private async disposeSubscription(unsubscribe: () => Promise<void>): Promise<void> {
    try {
      await unsubscribe()
    } catch {
      // Stream cleanup must not expose infrastructure failures to the client.
    }
  }

  private releaseSubscription(state: StreamNotificationsState): void {
    if (!state.isReserved) return
    state.isReserved = false

    const key = this.getSubscriptionKey(state.request.actor)
    const activeSubscriptions =
      StreamNotificationsUseCase.activeSubscriptions.get(key) ?? 0
    if (activeSubscriptions <= 1) {
      StreamNotificationsUseCase.activeSubscriptions.delete(key)
      return
    }
    StreamNotificationsUseCase.activeSubscriptions.set(key, activeSubscriptions - 1)
  }

  private getSubscriptionKey(actor: NotificationActor): string {
    return `${actor.establishmentId}:${actor.id}`
  }

  private validateActor(actor: NotificationActor): void {
    if (
      actor.profile !== NotificationActorProfile.Manager &&
      actor.profile !== NotificationActorProfile.Operator
    )
      throw new AuthorizationError(
        'Somente gestores e operadores podem receber notificações em tempo real.',
      )
  }
}
