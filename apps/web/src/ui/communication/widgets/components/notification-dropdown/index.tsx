import { createElement } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { NotificationList } from '../notification-list'
import { NotificationListState } from '../notification-list-state'
import { useNotificationDropdown } from './use-notification-dropdown'

export type NotificationDropdownProps = Record<string, never>

export const NotificationDropdown = (_props: NotificationDropdownProps) => {
  const notificationDropdown = useNotificationDropdown()

  return (
    <div className='relative shrink-0'>
      <NotificationDropdownTrigger {...notificationDropdown} />
      <NotificationDropdownPanel {...notificationDropdown} />
    </div>
  )
}

type NotificationDropdownControlProps = Pick<
  NotificationDropdownPanelProps,
  'handleToggle' | 'isOpen' | 'triggerRef' | 'unreadCount'
>

const NotificationDropdownTrigger = ({
  handleToggle,
  isOpen,
  triggerRef,
  unreadCount,
}: NotificationDropdownControlProps) => (
  <Button
    aria-controls='notification-dropdown-panel'
    aria-expanded={isOpen}
    aria-label={getNotificationTriggerLabel(unreadCount)}
    className='relative size-10 rounded-lg border-0 text-muted-foreground'
    onClick={handleToggle}
    ref={triggerRef}
    size='icon'
    type='button'
    variant='ghost'
  >
    <Icon name='bell' className='size-[18px]' />
    {unreadCount > 0 ? <NotificationBadge count={unreadCount} /> : null}
  </Button>
)

function getNotificationTriggerLabel(unreadCount: number) {
  return unreadCount > 0
    ? `Notificações, ${unreadCount} não lidas`
    : 'Notificações, nenhuma não lida'
}

const NotificationBadge = ({ count }: { count: number }) => (
  <Badge
    aria-hidden='true'
    className='absolute top-1 right-1 h-4 min-w-4 rounded-full bg-danger px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-card'
  >
    {count}
  </Badge>
)

type NotificationDropdownPanelProps = ReturnType<typeof useNotificationDropdown>

const NotificationDropdownPanel = (props: NotificationDropdownPanelProps) =>
  props.isOpen ? createNotificationDropdownPanel(props) : null

const NotificationDropdownPanelAttributes = {
  'aria-label': 'Notificações',
  className:
    'absolute top-[calc(100%+8px)] right-0 z-50 flex max-h-[calc(100vh-96px)] w-[min(403px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.2)] motion-reduce:transition-none max-sm:fixed max-sm:inset-x-2 max-sm:top-20 max-sm:w-auto',
  id: 'notification-dropdown-panel',
  role: 'dialog',
} as const

const createNotificationDropdownPanel = (props: NotificationDropdownPanelProps) =>
  createElement(
    'div',
    { ...NotificationDropdownPanelAttributes, ref: props.panelRef },
    createNotificationDropdownPanelChildren(props),
  )

const createNotificationDropdownPanelChildren = (
  props: NotificationDropdownPanelProps,
) => [
  createElement(NotificationDropdownHeader, {
    onClose: props.handleClose,
    key: 'header',
  }),
  createElement(NotificationDropdownContent, {
    displayedNotifications: props.displayedNotifications ?? props.recentNotifications,
    isLoadingRecentNotifications: props.isLoadingRecentNotifications,
    recentNotificationsError: props.recentNotificationsError,
    refetchRecentNotifications: props.refetchRecentNotifications,
    key: 'content',
  }),
  createElement(NotificationDropdownFooter, {
    onOpenAll: props.handleOpenAll,
    key: 'footer',
  }),
]

const NotificationDropdownHeader = ({ onClose }: { onClose: () => void }) =>
  createElement(
    'header',
    {
      className:
        'flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4',
    },
    createElement('h2', { className: 'text-lg font-extrabold' }, 'Notificações'),
    createElement(
      Button,
      {
        'aria-label': 'Fechar notificações',
        className: 'size-8 rounded-lg text-muted-foreground',
        onClick: onClose,
        size: 'icon',
        type: 'button',
        variant: 'ghost',
      },
      createElement(Icon, { className: 'size-4', name: 'x' }),
    ),
  )

type NotificationDropdownContentProps = Pick<
  NotificationDropdownPanelProps,
  | 'displayedNotifications'
  | 'isLoadingRecentNotifications'
  | 'recentNotificationsError'
  | 'refetchRecentNotifications'
>

const NotificationDropdownContent = ({
  displayedNotifications,
  isLoadingRecentNotifications,
  recentNotificationsError,
  refetchRecentNotifications,
}: NotificationDropdownContentProps) =>
  createElement(
    'div',
    { className: 'min-h-0 flex-1 overflow-y-auto overscroll-contain' },
    createElement(NotificationDropdownList, {
      displayedNotifications,
      isLoadingRecentNotifications,
      recentNotificationsError,
      refetchRecentNotifications,
    }),
  )

const NotificationDropdownList = (props: NotificationDropdownContentProps) =>
  getNotificationDropdownList(props)

const getNotificationDropdownList = (props: NotificationDropdownContentProps) =>
  props.isLoadingRecentNotifications
    ? createElement(NotificationListState, { state: 'loading' })
    : props.recentNotificationsError
      ? createElement(NotificationListState, {
          onRetry: () => void props.refetchRecentNotifications(),
          state: 'first-error',
        })
      : props.displayedNotifications.length === 0
        ? createElement(NotificationListState, { state: 'empty' })
        : createElement(NotificationList, {
            compact: true,
            isObservationEnabled: true,
            notifications: props.displayedNotifications,
            showDateHeadings: false,
          })

const NotificationDropdownFooter = ({ onOpenAll }: { onOpenAll: () => void }) =>
  createElement(
    'footer',
    { className: 'shrink-0 border-t border-border-soft px-5 py-4 text-center' },
    createElement(
      Anchor,
      {
        className:
          'text-sm font-extrabold text-primary underline-offset-4 hover:underline',
        onClick: onOpenAll,
        route: 'notifications',
      },
      'Ver todas as notificações',
    ),
  )
