import type { Entity } from '#shared/domain/entities/entity.ts'
import type { NotificationKind } from '#communication/domain/structures/notification-kind.ts'

export type Notification = Entity & {
  readonly sourceEventId: string
  readonly establishmentId: string
  readonly recipientUserId: string
  readonly kind: NotificationKind
  readonly title: string
  readonly message: string
  readonly occurredAt: Date
  readonly createdAt: Date
  readonly readAt?: Date
}
