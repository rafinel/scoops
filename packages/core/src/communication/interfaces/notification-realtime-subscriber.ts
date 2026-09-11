import type { Notification } from '#communication/domain/entities/notification.ts'

export interface NotificationRealtimeSubscriber {
  subscribe(
    listener: (notification: Notification) => Promise<void> | void,
  ): Promise<() => Promise<void>>
}
