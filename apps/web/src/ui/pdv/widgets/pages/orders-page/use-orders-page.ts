import { useEffect, useState } from 'react'

import { orderDetailsRoute } from '@/constants/routes'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useSalesChannelsQuery } from '@/ui/pdv/hooks/use-sales-channels-query'
import { useOrdersQuery } from '@/ui/pdv/hooks/use-orders-query'
import type { OrdersSearch } from '@scoops/validation'

export type OrdersPageProps = {
  search: OrdersSearch
  onSearchChange: (search: OrdersSearch) => void
}

export function useOrdersPage({ onSearchChange, search }: OrdersPageProps) {
  const [isPeriodReady, setPeriodReady] = useState(false)
  const { navigateTo, navigateToPath } = useNavigation()
  const periodBounds = resolveOrderPeriod(search)
  const ordersQuery = useOrdersQuery({
    ...periodBounds,
    isPeriodReady,
    page: search.page,
    pageSize: 6,
    search: search.search || undefined,
    status: search.status,
    channelId: search.channelId === 'none' ? null : search.channelId,
  })
  const channelsQuery = useSalesChannelsQuery()

  useEffect(() => {
    setPeriodReady(true)
  }, [])

  function handleSearchChange(nextSearch: OrdersSearch) {
    onSearchChange(nextSearch)
  }

  function handleClearFilters() {
    handleSearchChange({
      channelId: undefined,
      search: '',
      period: 'last-30-days',
      status: undefined,
      page: 1,
    })
  }

  function handlePageChange(page: number) {
    handleSearchChange({ ...search, page: Math.max(1, page) })
  }

  function handleOpenOrder(orderId: string) {
    void navigateToPath(orderDetailsRoute(orderId))
  }

  function handleNewSale() {
    void navigateTo('newSale')
  }

  const hasFilters = Boolean(
    search.search || search.channelId || search.status || search.period === 'custom',
  )
  const ordersPage = ordersQuery.ordersPage

  return {
    channels: channelsQuery.salesChannels,
    hasFilters,
    isLoadingChannels: channelsQuery.isLoadingSalesChannels,
    isLoadingOrders: !isPeriodReady || ordersQuery.isLoadingOrders,
    ordersError: ordersQuery.ordersError,
    ordersPage,
    refetchOrders: ordersQuery.refetchOrders,
    handleClearFilters,
    handleNewSale,
    handleOpenOrder,
    handlePageChange,
    handleSearchChange,
    search,
  }
}

function resolveOrderPeriod(search: OrdersSearch) {
  if (search.period === 'custom' && search.from && search.to) {
    return {
      createdFrom: toLocalStart(search.from),
      createdTo: toLocalEnd(search.to),
    }
  }

  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
  return {
    createdFrom: new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      0,
      0,
      0,
      0,
    ),
    createdTo: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    ),
  }
}

function toLocalStart(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function toLocalEnd(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}
