import type { Notification } from '@scoops/core/communication/domain/entities'

import { NotificationRow } from '../notification-row'
import { useNotificationList } from './use-notification-list'

export type NotificationListProps = {
  compact?: boolean
  isObservationEnabled?: boolean
  notifications: readonly Notification[]
  showDateHeadings?: boolean
}

export const NotificationList = ({
  compact = false,
  isObservationEnabled = true,
  notifications,
  showDateHeadings = true,
}: NotificationListProps) => {
  const { dateGroups, listRef } = useNotificationList({
    isObservationEnabled,
    notifications,
  })

  return (
    <div ref={listRef} className='min-w-0'>
      {showDateHeadings
        ? dateGroups.map((group) => (
            <section aria-labelledby={`notification-date-${group.key}`} key={group.key}>
              <h3
                className='px-5 pb-2 pt-5 text-xs font-bold tracking-wide text-muted-foreground sm:px-6'
                id={`notification-date-${group.key}`}
              >
                {group.label}
              </h3>
              <ul aria-label={`Notificações de ${group.label.toLowerCase()}`}>
                {group.notifications.map((notification) => (
                  <NotificationRow
                    compact={compact}
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </ul>
            </section>
          ))
        : [
            <ul aria-label='Notificações' key='notifications'>
              {dateGroups.flatMap((group) =>
                group.notifications.map((notification) => (
                  <NotificationRow
                    compact={compact}
                    key={notification.id}
                    notification={notification}
                  />
                )),
              )}
            </ul>,
          ]}
    </div>
  )
}
