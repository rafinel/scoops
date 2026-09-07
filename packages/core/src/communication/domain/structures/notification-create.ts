import type { Notification } from '#communication/domain/entities/notification.ts'

export type NotificationCreate = Omit<Notification, 'id'>
