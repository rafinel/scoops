import {
  NotificationKind,
  type NotificationKind as NotificationKindValue,
} from '@scoops/core/communication/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const notificationKindModel = pgEnum(
  'communication_notification_kind',
  Object.values(NotificationKind) as [NotificationKindValue, ...NotificationKindValue[]],
)
