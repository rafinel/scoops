import type { Notification } from '@scoops/core/communication/domain/entities'
import { AppError } from '@scoops/core/shared/domain/errors'
import type { NotificationRealtimeSubscriber } from '@scoops/core/communication/interfaces'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import {
  DrizzleClient,
  type DatabaseListener,
} from '@/shared/database/drizzle/drizzle-client'

const NOTIFICATIONS_CHANNEL = 'scoops_notifications'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type NotificationWakeUp = {
  notificationId: string
  recipientUserId: string
  establishmentId: string
}

function isNotificationWakeUp(value: unknown): value is NotificationWakeUp {
  if (!isRecord(value)) return false
  return (
    isUuid(value.notificationId) &&
    isUuid(value.recipientUserId) &&
    isUuid(value.establishmentId)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

@Injectable()
export class PostgresNotificationRealtimeSubscriber
  implements NotificationRealtimeSubscriber, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PostgresNotificationRealtimeSubscriber.name)
  private readonly listeners = new Set<
    (notification: Notification) => Promise<void> | void
  >()
  private listener: DatabaseListener | undefined
  private isShuttingDown = false

  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    this.listener = await this.drizzleClient.listen(
      NOTIFICATIONS_CHANNEL,
      (payload) => void this.handlePayload(payload),
      () => this.logReady(),
      (error) => this.logInfrastructureError(error),
    )
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true
    this.listeners.clear()
    await this.listener?.unlisten()
    this.listener = undefined
  }

  async subscribe(
    listener: (notification: Notification) => Promise<void> | void,
  ): Promise<() => Promise<void>> {
    if (this.isShuttingDown) {
      throw new AppError('O assinante de notificações está encerrando.')
    }

    this.listeners.add(listener)

    return async () => {
      this.listeners.delete(listener)
    }
  }

  private async handlePayload(payload: string): Promise<void> {
    const wakeUp = this.parseWakeUp(payload)
    if (!wakeUp || this.isShuttingDown) return
    return this.processWakeUp(wakeUp)
  }

  private async processWakeUp(wakeUp: NotificationWakeUp): Promise<void> {
    try {
      const notification = await this.notificationsRepository.findByIdForRecipient(wakeUp)
      if (notification) await this.notifyListeners(notification)
    } catch (error) {
      this.logInfrastructureError(error)
    }
  }

  private notifyListeners(notification: Notification) {
    return Promise.all(
      [...this.listeners].map((listener) => this.notifyListener(listener, notification)),
    )
  }

  private async notifyListener(
    listener: (notification: Notification) => Promise<void> | void,
    notification: Notification,
  ): Promise<void> {
    await Promise.resolve(listener(notification)).catch((error: unknown) => {
      this.logInfrastructureError(error)
    })
  }

  private parseWakeUp(payload: string): NotificationWakeUp | null {
    try {
      return parseNotificationWakeUp(JSON.parse(payload))
    } catch {
      return null
    }
  }

  private createInfrastructureErrorMessage(error: unknown): string {
    return JSON.stringify({
      signal: 'communication_notification_listener_error',
      errorCode: error instanceof Error ? error.name : 'unknown_error',
    })
  }

  private logReady(): void {
    this.logger.log(
      JSON.stringify({
        signal: 'communication_notification_listener_ready',
      }),
    )
  }

  private logInfrastructureError(error: unknown): void {
    this.logger.warn(this.createInfrastructureErrorMessage(error))
  }
}

function parseNotificationWakeUp(value: unknown): NotificationWakeUp | null {
  return isNotificationWakeUp(value) ? value : null
}
