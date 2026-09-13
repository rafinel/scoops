import { NotificationDropdownList } from '../notification-dropdown-list'
import type { NotificationDropdownPanelProps } from '../notification-dropdown-panel'

export type NotificationDropdownContentProps = Pick<
  NotificationDropdownPanelProps,
  | 'displayedNotifications'
  | 'isLoadingRecentNotifications'
  | 'recentNotificationsError'
  | 'refetchRecentNotifications'
>

export const NotificationDropdownContent = ({
  displayedNotifications,
  isLoadingRecentNotifications,
  recentNotificationsError,
  refetchRecentNotifications,
}: NotificationDropdownContentProps) => (
  <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
    <NotificationDropdownList
      displayedNotifications={displayedNotifications}
      isLoadingRecentNotifications={isLoadingRecentNotifications}
      recentNotificationsError={recentNotificationsError}
      refetchRecentNotifications={refetchRecentNotifications}
    />
  </div>
)
