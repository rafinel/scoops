import { NotificationList } from '../../notification-list'
import { NotificationListState } from '../../notification-list-state'
import type { NotificationDropdownContentProps } from '../notification-dropdown-content'

export type NotificationDropdownListProps = NotificationDropdownContentProps

export const NotificationDropdownList = ({
  displayedNotifications,
  isLoadingRecentNotifications,
  recentNotificationsError,
  refetchRecentNotifications,
}: NotificationDropdownListProps) => {
  if (isLoadingRecentNotifications) return <NotificationListState state='loading' />

  if (recentNotificationsError)
    return (
      <NotificationListState
        onRetry={() => void refetchRecentNotifications()}
        state='first-error'
      />
    )

  if (displayedNotifications.length === 0) return <NotificationListState state='empty' />

  return (
    <NotificationList
      compact
      isObservationEnabled
      notifications={displayedNotifications}
      showDateHeadings={false}
    />
  )
}
