import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'

import { NotificationList } from '../../components/notification-list'
import { NotificationListState } from '../../components/notification-list-state'
import {
  NotificationPeriodFilter,
  type NotificationPeriod,
} from '../../components/notification-period-filter'
import { useNotificationsPage } from './use-notifications-page'

export const NotificationsPage = () => {
  const {
    hasLoadedNotifications,
    hasHistory,
    hasNextPage,
    isLoadingNextNotifications,
    isLoadingNotifications,
    isNextNotificationsError,
    notifications,
    notificationsError,
    period,
    handleBack,
    handleLoadMore,
    handlePeriodChange,
    handleResetPeriod,
    handleRetry,
  } = useNotificationsPage()

  const hasNotifications = notifications.length > 0
  const isFilteredEmpty = !hasNotifications && hasHistory

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4'>
        <div>
          <BackLink
            aria-label='Voltar para página anterior'
            className='-ml-2 mb-3'
            onClick={handleBack}
            route='app'
          >
            Voltar
          </BackLink>
          <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>Notificações</h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Acompanhe alertas e atualizações importantes da sua operação.
          </p>
        </div>
        <NotificationPeriodFilter
          onChange={handlePeriodChange}
          period={period as NotificationPeriod}
        />
      </header>

      <section
        aria-labelledby='all-notifications-heading'
        className='min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card'
      >
        <header className='border-b border-border-soft px-5 py-5 sm:px-6'>
          <h2 className='text-base font-extrabold' id='all-notifications-heading'>
            Todas as notificações
          </h2>
        </header>

        {isLoadingNotifications ? (
          <NotificationListState state='loading' />
        ) : notificationsError && !hasLoadedNotifications ? (
          <NotificationListState onRetry={() => void handleRetry()} state='first-error' />
        ) : !hasNotifications ? (
          <NotificationListState
            onReset={handleResetPeriod}
            state={isFilteredEmpty ? 'filtered-empty' : 'empty'}
          />
        ) : (
          <>
            <NotificationList notifications={notifications} />
            {isNextNotificationsError ? (
              <NotificationListState onRetry={handleLoadMore} state='next-error' />
            ) : isLoadingNextNotifications ? (
              <NotificationListState state='next-loading' />
            ) : hasNextPage ? (
              <div className='border-t border-border-soft px-5 py-4 text-center'>
                <Button
                  className='min-w-24 bg-accent text-primary hover:bg-accent/80 motion-reduce:transition-none'
                  disabled={isLoadingNextNotifications}
                  onClick={handleLoadMore}
                  type='button'
                  variant='secondary'
                >
                  Ver mais
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </section>
  )
}
