import type { Notification } from '#communication/domain/entities/notification.ts'
import type { NotificationCreate } from '#communication/domain/structures/notification-create.ts'
import type { NotificationListParams } from '#communication/domain/structures/notification-list-params.ts'
import type { NotificationPage } from '#communication/domain/structures/notification-page.ts'

export interface NotificationsRepository {
  addMany(inputs: readonly NotificationCreate[]): Promise<void>
  findByIdForRecipient(input: {
    notificationId: string
    recipientUserId: string
    establishmentId: string
  }): Promise<Notification | null>
  findPage(input: NotificationListParams): Promise<NotificationPage>
  markRead(input: {
    establishmentId: string
    recipientUserId: string
    notificationIds: readonly string[]
    readAt: Date
  }): Promise<readonly string[]>
  removeAll(): Promise<void>
}
