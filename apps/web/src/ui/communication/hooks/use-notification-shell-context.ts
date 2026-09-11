import { useContext } from 'react'

import { AppError } from '@scoops/core/shared/domain/errors'

import { NotificationShellContext } from '@/ui/communication/contexts/notification-shell-context'

export function useNotificationShellContext() {
  const context = useOptionalNotificationShellContext()
  if (!context) {
    throw new AppError(
      'useNotificationShellContext deve ser usado dentro de NotificationShell.',
    )
  }
  return context
}

export function useOptionalNotificationShellContext() {
  return useContext(NotificationShellContext)
}
