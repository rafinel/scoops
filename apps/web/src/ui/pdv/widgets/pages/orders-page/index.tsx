import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { OrdersFilters } from './orders-filters'
import { OrdersList } from './orders-list'
import { OrdersEmptyState } from './orders-empty-state'
import { OrdersError } from './orders-error'
import { OrdersFilteredEmptyState } from './orders-filtered-empty-state'
import { OrdersLoading } from './orders-loading'
import { type OrdersPageProps, useOrdersPage } from './use-orders-page'

export type { OrdersPageProps }

export const OrdersPage = (props: OrdersPageProps) => {
  const {
    channels,
    hasFilters,
    isLoadingChannels,
    isLoadingOrders,
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
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-[28px] font-extrabold tracking-tight'>
            Pedidos{' '}
            <span className='text-lg font-semibold text-muted-foreground'>
              ({ordersPage?.total ?? 0})
            </span>
          </h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Consulte as vendas registradas ou canceladas e abra os detalhes de cada
            pedido.
          </p>
        </div>
        <Button
          className='min-h-11 rounded-[10px] px-4 font-extrabold shadow-primary'
          onClick={handleNewSale}
          type='button'
        >
          <Icon name='shopping-cart' /> Nova venda
        </Button>
      </header>
      <OrdersFilters
        channels={channels}
        isLoadingChannels={isLoadingChannels}
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
          onOpenOrder={handleOpenOrder}
          onPageChange={handlePageChange}
          ordersPage={ordersPage}
        />
      ) : null}
    </section>
  )
}
