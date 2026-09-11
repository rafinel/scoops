import type { Notification } from '@scoops/core/communication/domain/entities'

import { NOTIFICATION_PRESENTATION } from '@/ui/communication/constants'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

import { useNotificationToast } from './use-notification-toast'

export type NotificationToastProps = {
  notification: Notification
  onDismiss: () => void
  onOpen: () => void
}

export const NotificationToast = ({
  notification,
  onDismiss,
  onOpen,
}: NotificationToastProps) => {
  const controller = useNotificationToast(onDismiss)
  const presentation = NOTIFICATION_PRESENTATION[notification.kind]
  const announcement = `${notification.title}. ${notification.message}`

  return (
    <article
      aria-atomic='true'
      aria-label={announcement}
      aria-live='polite'
      className='pointer-events-auto flex w-[min(397px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[0_12px_30px_rgba(0,0,0,0.12)] outline-none sm:gap-4'
      onBlur={controller.handleBlur}
      onFocus={controller.handleFocus}
      onKeyDown={controller.handleKeyDown}
      onMouseEnter={controller.handleMouseEnter}
      onMouseLeave={controller.handleMouseLeave}
      role='status'
      tabIndex={-1}
    >
      <span
        aria-hidden='true'
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full',
          presentation.iconContainerClassName,
        )}
      >
        <Icon
          className={cn('size-[18px]', presentation.iconClassName)}
          name={presentation.icon}
        />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='line-clamp-2 break-words text-sm font-extrabold'>
          {notification.title}
        </p>
        <p className='mt-0.5 line-clamp-3 break-words text-sm font-medium text-muted-foreground'>
          {notification.message}
        </p>
        <div className='mt-3 flex items-center gap-1'>
          <Button
            aria-label='Abrir notificação'
            className='h-7 px-2 text-xs font-bold'
            onClick={onOpen}
            size='sm'
            type='button'
            variant='ghost'
          >
            Abrir notificação
            <Icon name='chevron-right' className='size-3.5' />
          </Button>
        </div>
      </div>
      <Button
        aria-label='Fechar notificação'
        className='-mr-2 -mt-2 size-8 shrink-0 rounded-lg text-muted-foreground'
        onClick={controller.handleDismiss}
        size='icon'
        type='button'
        variant='ghost'
      >
        <Icon name='x' className='size-4' />
      </Button>
    </article>
  )
}
