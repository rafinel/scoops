import type { NotificationCursor } from '#communication/domain/structures/notification-cursor.ts'

export type NotificationListParams = {
  readonly establishmentId: string
  readonly recipientUserId: string
  readonly limit: number
  readonly occurredFrom?: Date
  readonly occurredTo?: Date
  readonly cursor?: NotificationCursor
}
