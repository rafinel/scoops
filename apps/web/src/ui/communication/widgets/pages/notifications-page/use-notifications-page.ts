import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import type { NotificationsSearch } from '@scoops/validation'

import { ROUTES } from '@/constants/routes'
import { useNotificationsQuery } from '@/ui/communication/hooks/use-notifications-query'
import type { NotificationPeriod } from '@/ui/communication/widgets/components/notification-period-filter'

export type NotificationsPageSearch = NotificationsSearch

export function useNotificationsPage() {
  const search = useSearch({ strict: false }) as Partial<NotificationsPageSearch>
  const navigate = useNavigate({ from: '/notifications/' as never })
  const router = useRouter()
  const [isPeriodReady, setPeriodReady] = useState(false)
  const period = search.period ?? 'last-30-days'
  const bounds = useMemo(
    () => (isPeriodReady ? getPeriodBounds(period) : {}),
    [isPeriodReady, period],
  )
  const notificationsQuery = useNotificationsQuery({
    ...bounds,
    enabled: isPeriodReady,
    limit: 20,
  })
  const historyQuery = useNotificationsQuery({
    enabled: isPeriodReady && period !== 'all',
    limit: 1,
  })

  useEffect(() => {
    setPeriodReady(true)
  }, [])

  function handlePeriodChange(nextPeriod: NotificationPeriod) {
    void navigate({
      search: (previous: never) => ({
        ...(previous as unknown as NotificationsPageSearch),
        period: nextPeriod,
      }),
    } as never)
  }

  function handleResetPeriod() {
    handlePeriodChange('last-30-days')
  }

  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    if (!router.history.canGoBack()) {
      void navigate({ to: ROUTES.app } as never)
      return
    }
    event.preventDefault()
    router.history.back()
  }

  function handleLoadMore() {
    if (!notificationsQuery.hasNextPage || notificationsQuery.isFetchingNextPage) return
    void notificationsQuery.fetchNextNotifications()
  }

  return {
    hasLoadedNotifications: notificationsQuery.hasLoadedNotifications,
    hasHistory:
      period === 'all'
        ? notificationsQuery.notifications.length > 0
        : historyQuery.notifications.length > 0,
    hasNextPage: notificationsQuery.hasNextPage,
    bounds,
    isLoadingNextNotifications: notificationsQuery.isLoadingNextNotifications,
    isLoadingNotifications: !isPeriodReady || notificationsQuery.isLoadingNotifications,
    isRefreshingNotifications: notificationsQuery.isRefreshingNotifications,
    isNextNotificationsError: Boolean(
      notificationsQuery.isError && notificationsQuery.hasLoadedNotifications,
    ),
    notifications: notificationsQuery.notifications,
    notificationsError: notificationsQuery.notificationsError,
    period,
    handleLoadMore,
    handleBack,
    handlePeriodChange,
    handleResetPeriod,
    handleRetry: notificationsQuery.refetchNotifications,
  }
}

function getPeriodBounds(period: NotificationPeriod) {
  if (period === 'all') return {}

  const today = new Date()
  const days = period === 'last-7-days' ? 6 : period === 'last-90-days' ? 89 : 29
  const occurredFrom = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - days,
    0,
    0,
    0,
    0,
  )
  const occurredTo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999,
  )

  return { occurredFrom, occurredTo }
}
