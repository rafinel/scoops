import type { RefObject } from 'react'

import { NotificationBadge } from '../notification-badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type NotificationDropdownTriggerProps = {
  isOpen: boolean
  onToggle: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
  unreadCount: number
}

export const NotificationDropdownTrigger = ({
  isOpen,
  onToggle,
  triggerRef,
  unreadCount,
}: NotificationDropdownTriggerProps) => (
  <Button
    aria-controls='notification-dropdown-panel'
    aria-expanded={isOpen}
    aria-label={getNotificationTriggerLabel(unreadCount)}
    className='relative size-10 rounded-lg border-0 text-muted-foreground'
    onClick={onToggle}
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
