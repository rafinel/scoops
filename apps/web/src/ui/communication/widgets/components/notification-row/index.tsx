import { createElement } from 'react'

import type { Notification } from '@scoops/core/communication/domain/entities'

import { NOTIFICATION_PRESENTATION } from '@/ui/communication/constants'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

export type NotificationRowProps = {
  compact?: boolean
  notification: Notification
}

export const NotificationRow = ({
  compact = false,
  notification,
}: NotificationRowProps) =>
  createElement(
    'li',
    {
      'aria-label': notification.title,
      className: cn(
        'flex min-w-0 gap-3 border-b border-border-soft px-5 py-4 last:border-b-0 sm:gap-4 sm:px-6',
        compact && 'px-3.5 py-3 sm:px-4',
      ),
      'data-notification-id': notification.id,
    },
    createElement(NotificationRowIcon, { compact, kind: notification.kind }),
    createElement(NotificationRowContent, { notification }),
  )

const NotificationRowIcon = ({
  compact,
  kind,
}: Pick<NotificationRowProps, 'compact'> & { kind: Notification['kind'] }) => {
  return createNotificationKindIcon(kind, compact)
}

export const createNotificationKindIcon = (kind: Notification['kind'], compact = false) =>
  createElement(
    'span',
    {
      'aria-hidden': true,
      className: cn(
        'grid size-10 shrink-0 place-items-center rounded-full',
        compact && 'size-9',
        NOTIFICATION_PRESENTATION[kind].iconContainerClassName,
      ),
    },
    createElement(Icon, {
      className: cn('size-[18px]', NOTIFICATION_PRESENTATION[kind].iconClassName),
      name: NOTIFICATION_PRESENTATION[kind].icon,
    }),
  )

const NotificationRowContent = ({ notification }: { notification: Notification }) => (
  <div className='min-w-0 flex-1'>
    <div className='flex min-w-0 items-start gap-2'>
      <p
        className={cn(
          'min-w-0 flex-1 break-words text-sm',
          notification.readAt ? 'font-semibold' : 'font-extrabold',
        )}
      >
        {notification.title}
      </p>
      {!notification.readAt ? <NotificationUnreadIndicator /> : null}
    </div>
    <p className='mt-0.5 break-words text-sm font-medium text-muted-foreground'>
      {notification.message}
    </p>
    <NotificationOccurrence notification={notification} />
  </div>
)

const NotificationUnreadIndicator = () => (
  <span
    aria-label='Não lida'
    className='mt-1.5 size-2 shrink-0 rounded-full bg-primary'
    role='status'
  />
)

const NotificationOccurrence = ({ notification }: { notification: Notification }) => (
  <time
    className='mt-0.5 block text-xs font-medium text-muted-foreground'
    dateTime={notification.occurredAt.toISOString()}
  >
    {formatNotificationOccurrence(notification.occurredAt)}
  </time>
)

function formatNotificationOccurrence(occurredAt: Date) {
  const isToday = occurredAt.toDateString() === new Date().toDateString()
  if (isToday) return `Hoje, ${formatNotificationTime(occurredAt)}`
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(occurredAt)
}

function formatNotificationTime(occurredAt: Date) {
  return occurredAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
