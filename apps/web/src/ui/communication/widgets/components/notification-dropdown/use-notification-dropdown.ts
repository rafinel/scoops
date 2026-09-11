import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

import { useRecentNotificationsQuery } from '@/ui/communication/hooks/use-recent-notifications-query'
import { useOptionalNotificationShellContext } from '@/ui/communication/hooks/use-notification-shell-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useNotificationDropdown() {
  const [isOpen, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { navigateTo } = useNavigation()
  const shell = useOptionalNotificationShellContext()
  const {
    isLoadingRecentNotifications,
    recentNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    unreadCount,
  } = useRecentNotificationsQuery()

  const displayedNotifications = useMemo(() => {
    const selected = shell?.selectedNotification
    if (!selected) return recentNotifications
    return [
      selected,
      ...recentNotifications.filter((notification) => notification.id !== selected.id),
    ]
  }, [recentNotifications, shell?.selectedNotification])
  const effectiveIsOpen = shell?.isNotificationsOpen ?? isOpen
  useSelectedNotificationLifecycle(shell, recentNotifications)

  const handleClose = useCallback(
    (restoreFocus = true) => {
      if (shell) shell.closeNotifications()
      else setOpen(false)
      if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0)
    },
    [shell],
  )

  const handleToggle = useCallback(() => {
    if (effectiveIsOpen) {
      handleClose()
      return
    }
    if (shell) shell.openNotifications()
    else setOpen(true)
  }, [effectiveIsOpen, handleClose, shell])

  function handleOpenAll() {
    handleClose()
    void navigateTo('notifications')
  }

  useDropdownDismissal(effectiveIsOpen, handleClose, triggerRef, panelRef)

  return {
    handleClose,
    handleOpenAll,
    handleToggle,
    isLoadingRecentNotifications,
    isOpen: effectiveIsOpen,
    panelRef,
    recentNotifications,
    displayedNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    triggerRef,
    unreadCount,
  }
}

function useSelectedNotificationLifecycle(
  shell: ReturnType<typeof useOptionalNotificationShellContext>,
  recentNotifications: ReturnType<
    typeof useRecentNotificationsQuery
  >['recentNotifications'],
) {
  useEffect(() => {
    const selected = shell?.selectedNotification
    if (!selected) return
    const refreshed = recentNotifications.find(
      (notification) => notification.id === selected.id,
    )
    if (refreshed?.readAt) shell.clearSelectedNotification()
  }, [recentNotifications, shell])
}

function useDropdownDismissal(
  isOpen: boolean,
  handleClose: () => void,
  triggerRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      handleClose()
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [handleClose, isOpen, panelRef, triggerRef])
}
