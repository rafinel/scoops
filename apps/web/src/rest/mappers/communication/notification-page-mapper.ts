import { AppError } from '@scoops/core/shared/domain/errors'
import type { Notification } from '@scoops/core/communication/domain/entities'
import type {
  NotificationCursor,
  NotificationPage,
} from '@scoops/core/communication/domain/structures'

export type NotificationJson = Omit<
  Notification,
  'occurredAt' | 'createdAt' | 'readAt'
> & {
  occurredAt: string
  createdAt: string
  readAt?: string | null
}

export type NotificationCursorJson = Omit<NotificationCursor, 'occurredAt'> & {
  occurredAt: string
}

export type NotificationPageJson = Omit<NotificationPage, 'items' | 'nextCursor'> & {
  items: readonly NotificationJson[]
  nextCursor?: NotificationCursorJson | null
}

const mapDate = (value: string, errorMessage: string): Date => {
  if (typeof value !== 'string') throw new AppError(errorMessage)

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new AppError(errorMessage)

  return date
}

const mapNotification = (notification: NotificationJson): Notification => ({
  ...notification,
  occurredAt: mapDate(notification.occurredAt, 'Resposta inesperada da notificação'),
  createdAt: mapDate(notification.createdAt, 'Resposta inesperada da notificação'),
  readAt:
    notification.readAt === undefined || notification.readAt === null
      ? undefined
      : mapDate(notification.readAt, 'Resposta inesperada da notificação'),
})

const mapCursor = (cursor: NotificationCursorJson): NotificationCursor => ({
  ...cursor,
  occurredAt: mapDate(cursor.occurredAt, 'Resposta inesperada da notificação'),
})

export const NotificationPageMapper = (
  response: NotificationPageJson,
): NotificationPage => ({
  ...response,
  items: response.items.map(mapNotification),
  nextCursor: response.nextCursor ? mapCursor(response.nextCursor) : undefined,
})
