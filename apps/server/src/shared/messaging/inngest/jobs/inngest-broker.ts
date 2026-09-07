import { randomUUID } from 'node:crypto'

import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import type {
  EventsRepository,
  EventsRepositoryListener,
  OutboxEvent,
} from '@scoops/core/shared/interfaces'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { EVENTS_REPOSITORY } from '@/shared/database/drizzle/events/events-repository-token'
import {
  OutboxEventValidationError,
  validateOutboxEvent,
} from '@/shared/messaging/inngest/jobs/event-validation'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const RESERVATION_BATCH_SIZE = 100
const BACKOFF_MINUTES = [1, 5, 15, 60] as const
const BACKLOG_WARNING_MINUTES = 5

@Injectable()
export class InngestBroker implements OnModuleInit, OnModuleDestroy {
  private readonly instanceId = randomUUID()
  private readonly logger = new Logger(InngestBroker.name)
  private listener: EventsRepositoryListener | undefined
  private drainPromise: Promise<void> | undefined
  private drainRequested = false
  private isShuttingDown = false

  constructor(
    @Inject(InngestClient) private readonly inngest: InngestClient,
    @Inject(EVENTS_REPOSITORY) private readonly eventsRepository: EventsRepository,
    @Inject(DatetimeProvider) private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    let didConnect = false
    this.listener = await this.eventsRepository.subscribe(
      () => this.requestDrain(),
      () => {
        didConnect = true
        this.requestDrain()
      },
      (error) => this.logInfrastructureError(error),
    )
    if (!didConnect) this.requestDrain()
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true
    await this.listener?.unlisten()
    await this.drainPromise
  }

  private requestDrain(): void {
    if (this.isShuttingDown) return
    this.drainRequested = true
    if (this.drainPromise) return

    this.drainPromise = this.drain()
      .catch((error) => this.logInfrastructureError(error))
      .finally(() => {
        this.drainPromise = undefined
        if (this.drainRequested && !this.isShuttingDown) {
          this.drainRequested = false
          this.requestDrain()
        }
      })
  }

  private async drain(): Promise<void> {
    this.drainRequested = false
    const now = this.datetimeProvider.now()
    const owner = `${this.instanceId}:${randomUUID()}`

    await this.eventsRepository.releaseExpired(now, owner)
    const oldestPending = await this.eventsRepository.findOldestAvailable(now)
    this.emitBacklogSignal(oldestPending, now)
    const events = await this.eventsRepository.reserveAvailable(
      now,
      owner,
      RESERVATION_BATCH_SIZE,
    )

    await Promise.all(events.map((event) => this.publishEvent(event, owner, now)))
  }

  private async publishEvent(
    event: OutboxEvent,
    owner: string,
    now: Date,
  ): Promise<void> {
    try {
      validateOutboxEvent(event.eventName, event.payload)
      await this.inngest.send({
        id: event.id,
        name: event.eventName,
        data: event.payload,
      })
      await this.eventsRepository.markPublished(
        event.id,
        owner,
        this.datetimeProvider.now(),
      )
    } catch (error) {
      const attempts = event.attempts + 1
      const backoffMinutes =
        BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)]
      const updated = await this.eventsRepository.markDeliveryFailed({
        eventId: event.id,
        owner,
        attempts,
        availableAt: new Date(now.getTime() + backoffMinutes * 60 * 1000),
        errorCode:
          error instanceof OutboxEventValidationError
            ? 'invalid_event'
            : 'publish_failed',
        updatedAt: now,
      })

      if (updated && attempts >= 10) {
        this.logger.warn(
          JSON.stringify({
            signal: 'outbox_terminal_failure',
            eventId: event.id,
            attempts,
          }),
        )
      }
    }
  }

  private emitBacklogSignal(oldestPending: Date | null, now: Date): void {
    if (!oldestPending) return
    const ageMinutes = (now.getTime() - oldestPending.getTime()) / 60_000
    if (ageMinutes < BACKLOG_WARNING_MINUTES) return

    this.logger.warn(
      JSON.stringify({
        signal: 'outbox_pending_backlog',
        ageMinutes: Math.floor(ageMinutes),
      }),
    )
  }

  private logInfrastructureError(error: unknown): void {
    this.logger.error(
      JSON.stringify({
        signal: 'outbox_listener_error',
        errorCode: error instanceof Error ? error.name : 'unknown_error',
      }),
    )
  }
}
