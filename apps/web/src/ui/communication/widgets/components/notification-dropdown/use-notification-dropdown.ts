import { useCallback, useEffect, useRef, useState } from 'react'

import { useRecentNotificationsQuery } from '@/ui/communication/hooks/use-recent-notifications-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useNotificationDropdown() {
  const [isOpen, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { navigateTo } = useNavigation()
  const {
    isLoadingRecentNotifications,
    recentNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    unreadCount,
  } = useRecentNotificationsQuery()

  const handleClose = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose()
      return
    }
    setOpen(true)
  }, [handleClose, isOpen])

  function handleOpenAll() {
    handleClose()
    void navigateTo('notifications')
  }

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    function handlePointerDown(event: PointerEvent) {
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
  }, [handleClose, isOpen])

  return {
    handleClose,
    handleOpenAll,
    handleToggle,
    isLoadingRecentNotifications,
    isOpen,
    panelRef,
    recentNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    triggerRef,
    unreadCount,
  }
}
