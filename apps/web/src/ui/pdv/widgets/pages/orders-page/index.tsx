import { OrdersHeader } from './orders-header'
import { OrdersList } from './orders-list'
import { OrdersEmptyState } from './orders-empty-state'
import { OrdersError } from './orders-error'
import { OrdersFilteredEmptyState } from './orders-filtered-empty-state'
import { OrdersLoading } from './orders-loading'
import { OrdersToolbar } from './orders-toolbar'
import { type OrdersPageProps, useOrdersPage } from './use-orders-page'

export type { OrdersPageProps }

export const OrdersPage = (props: OrdersPageProps) => {
  const {
    channels,
    hasFilters,
    isLoadingChannels,
    isLoadingOrders,
    isPageLoadingOrders,
    isRefreshingChannels,
    isRefreshingOrders,
    ordersError,
    ordersPage,
    refetchOrders,
    handleClearFilters,
    handleNewSale,
    handleOpenOrder,
    handlePageChange,
    handleSearchChange,
    search,
  } = useOrdersPage(props)

  return (
    <section className='min-w-0 space-y-5'>
      <OrdersHeader onNewSale={handleNewSale} total={ordersPage?.total ?? 0} />
      <OrdersToolbar
        channels={channels}
        isLoadingChannels={isLoadingChannels}
        isRefreshingChannels={isRefreshingChannels}
        isRefreshingOrders={isRefreshingOrders}
        onClear={handleClearFilters}
        onSearchChange={handleSearchChange}
        search={search}
      />
      {isLoadingOrders ? <OrdersLoading /> : null}
      {!isLoadingOrders && ordersError ? (
        <OrdersError onRetry={() => void refetchOrders()} />
      ) : null}
      {!isLoadingOrders &&
      !ordersError &&
      ordersPage &&
      ordersPage.items.length === 0 &&
      hasFilters ? (
        <OrdersFilteredEmptyState onClear={handleClearFilters} />
      ) : null}
      {!isLoadingOrders &&
      !ordersError &&
      ordersPage &&
      ordersPage.items.length === 0 &&
      !hasFilters ? (
        <OrdersEmptyState onNewSale={handleNewSale} />
      ) : null}
      {!isLoadingOrders && !ordersError && ordersPage && ordersPage.items.length > 0 ? (
        <OrdersList
          isPageLoading={isPageLoadingOrders}
          onOpenOrder={handleOpenOrder}
          onPageChange={handlePageChange}
          ordersPage={ordersPage}
        />
      ) : null}
    </section>
  )
}
