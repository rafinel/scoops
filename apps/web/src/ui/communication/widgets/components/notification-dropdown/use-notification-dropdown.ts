import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

import type { Notification } from '@scoops/core/communication/domain/entities'

import { useRecentNotificationsQuery } from '@/ui/communication/hooks/use-recent-notifications-query'
import { useOptionalNotificationShellContext } from '@/ui/communication/hooks/use-notification-shell-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useNotificationDropdown() {
  const deps = useNotificationDropdownDependencies()
  const controls = useNotificationDropdownControls(deps)
  useDropdownDismissal(deps.isOpen, controls.handleClose, deps.triggerRef, deps.panelRef)
  return createNotificationDropdownController({ ...deps, ...controls })
}

function useNotificationDropdownDependencies() {
  const state = useDropdownState()
  return Object.assign(state, useNotificationDropdownView(state.isOpen))
}

function useNotificationDropdownView(isOpen: boolean) {
  const shell = useOptionalNotificationShellContext()
  const { navigateTo } = useNavigation()
  return Object.assign(useNotificationDropdownData(shell), {
    isOpen: shell?.isNotificationsOpen ?? isOpen,
    navigateTo,
    shell,
  })
}

function useNotificationDropdownData(
  shell: ReturnType<typeof useOptionalNotificationShellContext>,
) {
  const query = useRecentNotificationsQuery()
  useSelectedNotificationLifecycle(shell, query.recentNotifications)
  return {
    query,
    displayedNotifications: useDisplayedNotifications(shell, query.recentNotifications),
  }
}

function useNotificationDropdownControls(
  dependencies: ReturnType<typeof useNotificationDropdownDependencies>,
) {
  const handleClose = useDropdownClose(dependencies)
  const handleToggle = useDropdownToggle(dependencies, handleClose)
  return {
    handleClose,
    handleOpenAll: useOpenAllNotifications(handleClose, dependencies.navigateTo),
    handleToggle,
  }
}

const createNotificationDropdownController = ({
  query,
  ...controller
}: ReturnType<typeof useNotificationDropdownDependencies> &
  ReturnType<typeof useNotificationDropdownControls>) => {
  return Object.assign(controller, {
    isLoadingRecentNotifications: query.isLoadingRecentNotifications,
    recentNotifications: query.recentNotifications,
    recentNotificationsError: query.recentNotificationsError,
    refetchRecentNotifications: query.refetchRecentNotifications,
    unreadCount: query.unreadCount,
  })
}

function useDropdownState() {
  const [isOpen, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  return { isOpen, setOpen, triggerRef, panelRef }
}

function useDisplayedNotifications(
  shell: ReturnType<typeof useOptionalNotificationShellContext>,
  recentNotifications: readonly Notification[],
) {
  const selectedNotification = shell?.selectedNotification
  return useMemo(() => {
    if (!selectedNotification) return recentNotifications
    return [
      selectedNotification,
      ...recentNotifications.filter(
        (notification) => notification.id !== selectedNotification.id,
      ),
    ]
  }, [recentNotifications, selectedNotification])
}

function useOpenAllNotifications(
  handleClose: () => void,
  navigateTo: ReturnType<typeof useNavigation>['navigateTo'],
) {
  return useCallback(() => {
    handleClose()
    void navigateTo('notifications')
  }, [handleClose, navigateTo])
}

function useDropdownClose(
  dependencies: ReturnType<typeof useNotificationDropdownDependencies>,
) {
  const { setOpen, shell, triggerRef } = dependencies
  return useCallback(
    (restoreFocus = true) => {
      if (shell) shell.closeNotifications()
      else setOpen(false)
      if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0)
    },
    [setOpen, shell, triggerRef],
  )
}

function useDropdownToggle(
  dependencies: ReturnType<typeof useNotificationDropdownDependencies>,
  handleClose: () => void,
) {
  const { isOpen, setOpen, shell } = dependencies
  return useCallback(() => {
    if (isOpen) return handleClose()
    if (shell) shell.openNotifications()
    else setOpen(true)
  }, [handleClose, isOpen, setOpen, shell])
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
  useEffect(
    () =>
      isOpen
        ? subscribeToDropdownDismissal(handleClose, triggerRef, panelRef)
        : undefined,
    [handleClose, isOpen, panelRef, triggerRef],
  )
}

function subscribeToDropdownDismissal(
  handleClose: () => void,
  triggerRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  const handleKeyDown = (event: KeyboardEvent) => handleDropdownEscape(event, handleClose)
  const handlePointerDown = (event: PointerEvent) =>
    handleDropdownOutsidePointer(event, handleClose, triggerRef, panelRef)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('pointerdown', handlePointerDown)
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('pointerdown', handlePointerDown)
  }
}

function handleDropdownEscape(event: KeyboardEvent, handleClose: () => void) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  handleClose()
}

function handleDropdownOutsidePointer(
  event: PointerEvent,
  handleClose: () => void,
  triggerRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  const target = event.target
  if (isOutsideDropdown(target, triggerRef, panelRef)) handleClose()
}

function isOutsideDropdown(
  target: EventTarget | null,
  triggerRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  return (
    target instanceof Node &&
    !triggerRef.current?.contains(target) &&
    !panelRef.current?.contains(target)
  )
}
