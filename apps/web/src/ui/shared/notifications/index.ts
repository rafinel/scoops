import { createElement } from 'react'
import { toast } from 'sonner'

import type { Notification } from '@scoops/core/communication/domain/entities'

import { NotificationToast } from '@/ui/communication/widgets/components/notification-toast'

function showToast(callback: () => void) {
  if (typeof window === 'undefined') return
  callback()
}

export function showErrorToast(message: string) {
  showToast(() => toast.error(message))
}

export function showInfoToast(message: string) {
  showToast(() => toast.info(message))
}

export function showWarningToast(message: string) {
  showToast(() => toast.warning(message))
}

export type ShowNotificationToastOptions = {
  onDismiss?: () => void
  onOpen: () => void
}

export function showNotificationToast(
  notification: Notification,
  { onDismiss, onOpen }: ShowNotificationToastOptions,
) {
  if (typeof window === 'undefined') return null

  return toast.custom(
    (toastId) =>
      createElement(NotificationToast, {
        notification,
        onDismiss: () => toast.dismiss(toastId),
        onOpen,
      }),
    {
      duration: Number.POSITIVE_INFINITY,
      id: `notification-${notification.id}`,
      onDismiss,
    },
  )
}
