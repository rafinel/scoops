import type { Notification } from '#communication/domain/entities/notification.ts'
import type { NotificationCursor } from '#communication/domain/structures/notification-cursor.ts'

export type NotificationPage = {
  readonly items: readonly Notification[]
  readonly nextCursor?: NotificationCursor
  readonly unreadCount: number
}
