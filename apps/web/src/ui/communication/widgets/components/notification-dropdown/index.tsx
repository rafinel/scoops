import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { NotificationList } from '../notification-list'
import { NotificationListState } from '../notification-list-state'
import { useNotificationDropdown } from './use-notification-dropdown'

export type NotificationDropdownProps = Record<string, never>

export const NotificationDropdown = (_props: NotificationDropdownProps) => {
  const {
    handleClose,
    handleOpenAll,
    handleToggle,
    isLoadingRecentNotifications,
    isOpen,
    panelRef,
    recentNotifications,
    recentNotificationsError,
    refetchRecentNotifications,
    triggerRef,
    unreadCount,
  } = useNotificationDropdown()

  return (
    <div className='relative shrink-0'>
      <Button
        aria-controls='notification-dropdown-panel'
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Notificações, ${unreadCount} não lidas`
            : 'Notificações, nenhuma não lida'
        }
        className='relative size-10 rounded-lg border-0 text-muted-foreground'
        onClick={handleToggle}
        ref={triggerRef}
        size='icon'
        type='button'
        variant='ghost'
      >
        <Icon name='bell' className='size-[18px]' />
        {unreadCount > 0 ? (
          <span
            aria-hidden='true'
            className='absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-card'
          />
        ) : null}
      </Button>
      {isOpen ? (
        <div
          aria-label='Notificações'
          className='absolute top-[calc(100%+8px)] right-0 z-50 flex max-h-[calc(100vh-96px)] w-[min(403px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.2)] motion-reduce:transition-none max-sm:fixed max-sm:inset-x-2 max-sm:top-20 max-sm:w-auto'
          id='notification-dropdown-panel'
          ref={panelRef}
          role='dialog'
        >
          <header className='flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4'>
            <h2 className='text-lg font-extrabold'>Notificações</h2>
            <Button
              aria-label='Fechar notificações'
              className='size-8 rounded-lg text-muted-foreground'
              onClick={() => handleClose()}
              size='icon'
              type='button'
              variant='ghost'
            >
              <Icon name='x' className='size-4' />
            </Button>
          </header>
          <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
            {isLoadingRecentNotifications ? (
              <NotificationListState state='loading' />
            ) : recentNotificationsError ? (
              <NotificationListState
                onRetry={() => void refetchRecentNotifications()}
                state='first-error'
              />
            ) : recentNotifications.length === 0 ? (
              <NotificationListState state='empty' />
            ) : (
              <NotificationList
                compact
                isObservationEnabled
                notifications={recentNotifications}
                showDateHeadings={false}
              />
            )}
          </div>
          <footer className='shrink-0 border-t border-border-soft px-5 py-4 text-center'>
            <Anchor
              className='text-sm font-extrabold text-primary underline-offset-4 hover:underline'
              onClick={handleOpenAll}
              route='notifications'
            >
              Ver todas as notificações
            </Anchor>
          </footer>
        </div>
      ) : null}
    </div>
  )
}
