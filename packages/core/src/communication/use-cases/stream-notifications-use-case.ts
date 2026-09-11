import type { Notification } from '#communication/domain/entities/notification.ts'
import {
  NotificationActorProfile,
  type NotificationActor,
} from '#communication/domain/structures/notification-actor.ts'
import type { NotificationAudienceMember } from '#communication/domain/structures/notification-audience-member.ts'
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
const SUPPORTED_ACTOR_PROFILES = new Set([
  NotificationActorProfile.Manager,
  NotificationActorProfile.Operator,
])

function isSupportedActorProfile(profile: NotificationActor['profile']): boolean {
  return SUPPORTED_ACTOR_PROFILES.has(profile)
}

function isActiveAudienceMember(
  actor: NotificationActor,
  audience: readonly NotificationAudienceMember[],
): boolean {
  return audience.some(
    (member) => member.userId === actor.id && member.profile === actor.profile,
  )
}

function matchesNotificationActor(
  actor: NotificationActor,
  notification?: Notification,
): boolean {
  return (
    notification === undefined ||
    (notification.recipientUserId === actor.id &&
      notification.establishmentId === actor.establishmentId)
  )
}

export type StreamNotificationsRequest = {
  readonly actor: NotificationActor
  readonly isSessionActive: () => Promise<boolean>
  readonly notificationSink: (notification: Notification) => Promise<void> | void
  readonly signal: AbortSignal
}

class StreamNotificationsState {
  readonly abortHandler: () => void
  candidateTail = Promise.resolve()
  cleanupPromise?: Promise<void>
  isClosed = false
  isDraining = false
  isReserved = false
  notifications: Notification[] = []
  unsubscribe?: () => Promise<void>

  constructor(
    readonly request: StreamNotificationsRequest,
    cleanup: (state: StreamNotificationsState) => Promise<void>,
  ) {
    this.abortHandler = () => void cleanup(this)
  }
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

    const state = this.createState(request)
    this.reserveSubscription(state)
    this.listenForAbort(state)
    return this.openStreamSafely(state)
  }

  private listenForAbort(state: StreamNotificationsState): void {
    state.request.signal.addEventListener('abort', state.abortHandler, { once: true })
  }

  private async openStreamSafely(
    state: StreamNotificationsState,
  ): Promise<() => Promise<void>> {
    try {
      await this.openStream(state)
    } catch (error) {
      await this.handleStreamFailure(state, error)
    }

    return () => this.cleanup(state)
  }

  private createState(request: StreamNotificationsRequest): StreamNotificationsState {
    return new StreamNotificationsState(request, (state) => this.cleanup(state))
  }

  private async openStream(state: StreamNotificationsState): Promise<void> {
    if (await this.closeIfAborted(state)) return

    await this.ensureOpeningEligibility(state.request)
    if (await this.closeIfAborted(state)) return

    await this.subscribe(state)
  }

  private async subscribe(state: StreamNotificationsState): Promise<void> {
    const unsubscribe = await this.realtimeSubscriber.subscribe((notification) =>
      this.handleCandidate(state, notification),
    )
    await this.storeSubscription(state, unsubscribe)
  }

  private async storeSubscription(
    state: StreamNotificationsState,
    unsubscribe: () => Promise<void>,
  ): Promise<void> {
    if (state.isClosed) return this.disposeSubscription(unsubscribe)
    state.unsubscribe = unsubscribe
  }

  private async closeIfAborted(state: StreamNotificationsState): Promise<boolean> {
    if (!state.request.signal.aborted) return false
    await this.cleanup(state)
    return true
  }

  private async handleStreamFailure(
    state: StreamNotificationsState,
    error: unknown,
  ): Promise<never> {
    await this.cleanup(state)
    if (error instanceof AppError) throw error
    throw new ServiceUnavailableError(
      'O fluxo de notificações está indisponível no momento.',
    )
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
    const candidate = state.candidateTail.then(() =>
      this.processCandidate(state, notification),
    )

    state.candidateTail = candidate.catch(() => undefined)
    await candidate
  }

  private async processCandidate(
    state: StreamNotificationsState,
    notification: Notification,
  ): Promise<void> {
    if (state.isClosed) return

    try {
      await this.enqueueEligibleCandidate(state, notification)
    } catch {
      await this.cleanup(state)
    }
  }

  private async enqueueEligibleCandidate(
    state: StreamNotificationsState,
    notification: Notification,
  ): Promise<void> {
    if (!(await this.isEligible(state.request, notification))) return this.cleanup(state)
    await this.enqueue(state, notification)
  }

  private async isEligible(
    request: StreamNotificationsRequest,
    notification?: Notification,
  ): Promise<boolean> {
    return (
      (await request.isSessionActive()) &&
      (await this.isActiveAudienceMember(request.actor)) &&
      matchesNotificationActor(request.actor, notification)
    )
  }

  private async isActiveAudienceMember(actor: NotificationActor): Promise<boolean> {
    const audience = await this.audienceProvider.findManyActiveByEstablishment(
      actor.establishmentId,
    )
    return isActiveAudienceMember(actor, audience)
  }

  private async enqueue(
    state: StreamNotificationsState,
    notification: Notification,
  ): Promise<void> {
    if (state.isClosed) return

    if (!this.hasQueueCapacity(state)) return this.cleanup(state)

    state.notifications.push(notification)
    this.drain(state)
  }

  private hasQueueCapacity(state: StreamNotificationsState): boolean {
    return state.notifications.length < MAX_QUEUE_SIZE
  }

  private drain(state: StreamNotificationsState): void {
    if (state.isDraining) return
    state.isDraining = true
    void this.runDrain(state)
  }

  private async runDrain(state: StreamNotificationsState): Promise<void> {
    try {
      await this.drainQueue(state)
    } catch {
      await this.cleanup(state)
    } finally {
      state.isDraining = false
      this.restartDrain(state)
    }
  }

  private async drainQueue(state: StreamNotificationsState): Promise<void> {
    while (!state.isClosed && state.notifications.length > 0) {
      const notification = state.notifications.shift()
      if (notification === undefined) continue
      await state.request.notificationSink(notification)
    }
  }

  private restartDrain(state: StreamNotificationsState): void {
    if (!state.isClosed && state.notifications.length > 0) this.drain(state)
  }

  private reserveSubscription(state: StreamNotificationsState): void {
    const key = this.getSubscriptionKey(state.request.actor)
    const activeSubscriptions = this.getActiveSubscriptionCount(key)

    this.reserveSubscriptionSlot(key, activeSubscriptions)
    state.isReserved = true
  }

  private reserveSubscriptionSlot(key: string, activeSubscriptions: number): void {
    this.ensureSubscriptionCapacity(activeSubscriptions)
    this.setActiveSubscriptionCount(key, activeSubscriptions + 1)
  }

  private getActiveSubscriptionCount(key: string): number {
    return StreamNotificationsUseCase.activeSubscriptions.get(key) ?? 0
  }

  private setActiveSubscriptionCount(key: string, count: number): void {
    StreamNotificationsUseCase.activeSubscriptions.set(key, count)
  }

  private ensureSubscriptionCapacity(activeSubscriptions: number): void {
    if (activeSubscriptions >= MAX_ACTIVE_SUBSCRIPTIONS)
      throw new TooManyRequestsError(
        'O limite de conexões de notificações em tempo real foi atingido.',
      )
  }

  private async cleanup(state: StreamNotificationsState): Promise<void> {
    if (state.cleanupPromise) return state.cleanupPromise

    this.closeState(state)
    state.cleanupPromise = this.disposeStateSubscription(state)

    return state.cleanupPromise
  }

  private closeState(state: StreamNotificationsState): void {
    state.isClosed = true
    state.notifications.length = 0
    state.request.signal.removeEventListener('abort', state.abortHandler)
    this.releaseSubscription(state)
  }

  private async disposeStateSubscription(state: StreamNotificationsState): Promise<void> {
    const unsubscribe = state.unsubscribe
    state.unsubscribe = undefined
    if (unsubscribe) await this.disposeSubscription(unsubscribe)
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

    this.decrementSubscription(this.getSubscriptionKey(state.request.actor))
  }

  private decrementSubscription(key: string): void {
    const activeSubscriptions = this.getActiveSubscriptionCount(key)
    this.updateSubscriptionCount(key, activeSubscriptions)
  }

  private updateSubscriptionCount(key: string, activeSubscriptions: number): void {
    if (activeSubscriptions <= 1)
      StreamNotificationsUseCase.activeSubscriptions.delete(key)
    else this.setActiveSubscriptionCount(key, activeSubscriptions - 1)
  }

  private getSubscriptionKey(actor: NotificationActor): string {
    return `${actor.establishmentId}:${actor.id}`
  }

  private validateActor(actor: NotificationActor): void {
    if (isSupportedActorProfile(actor.profile)) return
    throw new AuthorizationError(
      'Somente gestores e operadores podem receber notificações em tempo real.',
    )
  }
}
