import type { Notification } from '@scoops/core/communication/domain/entities'

import type { DrizzleNotification } from '@/communication/database/drizzle/types/entities'

export class DrizzleNotificationMapper {
  static toDomain(record: DrizzleNotification): Notification {
    return {
      id: record.id,
      sourceEventId: record.sourceEventId,
      establishmentId: record.establishmentId,
      recipientUserId: record.recipientUserId,
      kind: record.kind,
      title: record.title,
      message: record.message,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
      readAt: record.readAt ?? undefined,
    }
  }
}
