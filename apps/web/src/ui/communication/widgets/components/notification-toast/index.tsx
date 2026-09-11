import { createElement } from 'react'

import type { Notification } from '@scoops/core/communication/domain/entities'

import { createNotificationKindIcon } from '../notification-row'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

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

  return (
    <NotificationToastFrame
      controller={controller}
      notification={notification}
      onOpen={onOpen}
    />
  )
}

const NotificationToastFrame = ({
  controller,
  notification,
  onOpen,
}: {
  controller: ReturnType<typeof useNotificationToast>
  notification: Notification
  onOpen: () => void
}) =>
  createElement(
    'article',
    {
      'aria-atomic': true,
      'aria-label': `${notification.title}. ${notification.message}`,
      'aria-live': 'polite',
      className:
        'pointer-events-auto flex w-[min(397px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[0_12px_30px_rgba(0,0,0,0.12)] outline-none sm:gap-4',
      onBlur: controller.handleBlur,
      onFocus: controller.handleFocus,
      onKeyDown: controller.handleKeyDown,
      onMouseEnter: controller.handleMouseEnter,
      onMouseLeave: controller.handleMouseLeave,
      role: 'status',
      tabIndex: -1,
    },
    createElement(NotificationToastIcon, { kind: notification.kind }),
    createElement(NotificationToastContent, { notification, onOpen }),
    createElement(NotificationToastDismiss, { onDismiss: controller.handleDismiss }),
  )

const NotificationToastIcon = ({ kind }: { kind: Notification['kind'] }) => {
  return createNotificationKindIcon(kind)
}

const NotificationToastContent = ({
  notification,
  onOpen,
}: Pick<NotificationToastProps, 'notification' | 'onOpen'>) => (
  <div className='min-w-0 flex-1'>
    <p className='line-clamp-2 break-words text-sm font-extrabold'>
      {notification.title}
    </p>
    <p className='mt-0.5 line-clamp-3 break-words text-sm font-medium text-muted-foreground'>
      {notification.message}
    </p>
    <Button
      aria-label='Abrir notificação'
      className='mt-3 h-7 px-2 text-xs font-bold'
      onClick={onOpen}
      size='sm'
      type='button'
      variant='ghost'
    >
      Abrir notificação
      <Icon name='chevron-right' className='size-3.5' />
    </Button>
  </div>
)

const NotificationToastDismiss = ({ onDismiss }: { onDismiss: () => void }) =>
  createElement(
    Button,
    {
      'aria-label': 'Fechar notificação',
      className: '-mr-2 -mt-2 size-8 shrink-0 rounded-lg text-muted-foreground',
      onClick: onDismiss,
      size: 'icon',
      type: 'button',
      variant: 'ghost',
    },
    createElement(Icon, { className: 'size-4', name: 'x' }),
  )
