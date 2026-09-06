import type { Notification } from '@scoops/core/communication/domain/entities'
import { NotificationKind } from '@scoops/core/communication/domain/structures'

import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

const NOTIFICATION_PRESENTATION: Record<
  Notification['kind'],
  { icon: IconName; iconClassName: string; iconContainerClassName: string }
> = {
  [NotificationKind.StockBelowIdeal]: {
    icon: 'package',
    iconClassName: 'text-warning',
    iconContainerClassName: 'bg-warning-soft',
  },
  [NotificationKind.StockZero]: {
    icon: 'triangle-alert',
    iconClassName: 'text-danger',
    iconContainerClassName: 'bg-danger-soft',
  },
  [NotificationKind.UserAdded]: {
    icon: 'user-plus',
    iconClassName: 'text-primary',
    iconContainerClassName: 'bg-accent',
  },
  [NotificationKind.UserPromoted]: {
    icon: 'shield-check',
    iconClassName: 'text-success',
    iconContainerClassName: 'bg-success-soft',
  },
  [NotificationKind.UserDemoted]: {
    icon: 'shield',
    iconClassName: 'text-warning',
    iconContainerClassName: 'bg-warning-soft',
  },
  [NotificationKind.UserInactivated]: {
    icon: 'shield-alert',
    iconClassName: 'text-muted-foreground',
    iconContainerClassName: 'bg-muted',
  },
  [NotificationKind.UserReactivated]: {
    icon: 'user-check',
    iconClassName: 'text-success',
    iconContainerClassName: 'bg-success-soft',
  },
}

export type NotificationRowProps = {
  compact?: boolean
  notification: Notification
}

export const NotificationRow = ({
  compact = false,
  notification,
}: NotificationRowProps) => {
  const presentation = NOTIFICATION_PRESENTATION[notification.kind]
  const now = new Date()
  const isToday = notification.occurredAt.toDateString() === now.toDateString()
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(notification.occurredAt)
  const occurrenceLabel = isToday
    ? `Hoje, ${time}`
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(notification.occurredAt)

  return (
    <li
      aria-label={notification.title}
      className={cn(
        'flex min-w-0 gap-3 border-b border-border-soft px-5 py-4 last:border-b-0 sm:gap-4 sm:px-6',
        compact && 'px-3.5 py-3 sm:px-4',
      )}
      data-notification-id={notification.id}
    >
      <span
        aria-hidden='true'
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full',
          compact && 'size-9',
          presentation.iconContainerClassName,
        )}
      >
        <Icon
          className={cn('size-[18px]', presentation.iconClassName)}
          name={presentation.icon}
        />
      </span>
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
          {!notification.readAt ? (
            <span
              aria-label='Não lida'
              className='mt-1.5 size-2 shrink-0 rounded-full bg-primary'
              role='status'
            />
          ) : null}
        </div>
        <p className='mt-0.5 break-words text-sm font-medium text-muted-foreground'>
          {notification.message}
        </p>
        <time
          className='mt-0.5 block text-xs font-medium text-muted-foreground'
          dateTime={notification.occurredAt.toISOString()}
        >
          {occurrenceLabel}
        </time>
      </div>
    </li>
  )
}
