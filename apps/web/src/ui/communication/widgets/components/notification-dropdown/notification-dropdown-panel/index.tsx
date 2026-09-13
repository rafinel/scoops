import { NotificationDropdownContent } from '../notification-dropdown-content'
import { NotificationDropdownFooter } from '../notification-dropdown-footer'
import { NotificationDropdownHeader } from '../notification-dropdown-header'
import type { useNotificationDropdown } from '../use-notification-dropdown'

export type NotificationDropdownPanelProps = Pick<
  ReturnType<typeof useNotificationDropdown>,
  | 'displayedNotifications'
  | 'handleClose'
  | 'handleOpenAll'
  | 'isLoadingRecentNotifications'
  | 'isOpen'
  | 'isRefreshingRecentNotifications'
  | 'panelRef'
  | 'recentNotifications'
  | 'recentNotificationsError'
  | 'refetchRecentNotifications'
>

export const NotificationDropdownPanel = (props: NotificationDropdownPanelProps) => {
  if (!props.isOpen) return null

  return (
    <div
      aria-label='Notificações'
      className='absolute top-[calc(100%+8px)] right-0 z-50 flex max-h-[calc(100vh-96px)] w-[min(403px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.2)] motion-reduce:transition-none max-sm:fixed max-sm:inset-x-2 max-sm:top-20 max-sm:w-auto'
      id='notification-dropdown-panel'
      ref={props.panelRef}
      role='dialog'
    >
      <NotificationDropdownHeader
        isRefreshing={props.isRefreshingRecentNotifications}
        onClose={props.handleClose}
      />
      <NotificationDropdownContent
        displayedNotifications={props.displayedNotifications ?? props.recentNotifications}
        isLoadingRecentNotifications={props.isLoadingRecentNotifications}
        recentNotificationsError={props.recentNotificationsError}
        refetchRecentNotifications={props.refetchRecentNotifications}
      />
      <NotificationDropdownFooter onOpenAll={props.handleOpenAll} />
    </div>
  )
}
