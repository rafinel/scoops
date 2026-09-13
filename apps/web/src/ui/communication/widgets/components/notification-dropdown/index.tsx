import { NotificationDropdownPanel } from './notification-dropdown-panel'
import { NotificationDropdownTrigger } from './notification-dropdown-trigger'
import { useNotificationDropdown } from './use-notification-dropdown'

export type NotificationDropdownProps = Record<string, never>

export const NotificationDropdown = (_props: NotificationDropdownProps) => {
  const {
    displayedNotifications,
    handleClose,
    handleOpenAll,
    handleToggle,
    isLoadingRecentNotifications,
    isOpen,
    isRefreshingRecentNotifications,
    panelRef,
    recentNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    triggerRef,
    unreadCount,
  } = useNotificationDropdown()

  return (
    <div className='relative shrink-0'>
      <NotificationDropdownTrigger
        isOpen={isOpen}
        onToggle={handleToggle}
        triggerRef={triggerRef}
        unreadCount={unreadCount}
      />
      <NotificationDropdownPanel
        displayedNotifications={displayedNotifications}
        handleClose={handleClose}
        handleOpenAll={handleOpenAll}
        isLoadingRecentNotifications={isLoadingRecentNotifications}
        isOpen={isOpen}
        isRefreshingRecentNotifications={isRefreshingRecentNotifications}
        panelRef={panelRef}
        recentNotifications={recentNotifications}
        recentNotificationsError={recentNotificationsError}
        refetchRecentNotifications={refetchRecentNotifications}
      />
    </div>
  )
}
