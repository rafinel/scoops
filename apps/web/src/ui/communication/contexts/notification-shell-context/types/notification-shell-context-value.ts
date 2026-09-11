import type { Notification } from '@scoops/core/communication/domain/entities'

export type NotificationShellContextValue = {
  clearSelectedNotification: () => void
  closeNotifications: () => void
  dismissNotification: (notificationId: string) => void
  isNotificationsOpen: boolean
  openNotification: (notification: Notification) => void
  openNotifications: () => void
  selectedNotification: Notification | null
}
