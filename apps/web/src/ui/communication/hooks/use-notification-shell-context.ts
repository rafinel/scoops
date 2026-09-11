import { useContext } from 'react'

import { AppError } from '@scoops/core/shared/domain/errors'

import { NotificationShellContext } from '@/ui/communication/contexts/notification-shell-context'

export function useNotificationShellContext() {
  const context = useContext(NotificationShellContext)
  assertNotificationShellContext(context)
  return context
}

function assertNotificationShellContext(
  context: ReturnType<typeof useOptionalNotificationShellContext>,
): asserts context {
  if (context) return
  throw new AppError(
    'useNotificationShellContext deve ser usado dentro de NotificationShell.',
  )
}

export function useOptionalNotificationShellContext() {
  return useContext(NotificationShellContext)
}
