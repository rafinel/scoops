import { OrdersFilters } from '../orders-filters'
import { OrdersRefreshStatus } from '../orders-refresh-status'
import type { OrdersPageProps } from '../use-orders-page'

export type OrdersToolbarProps = {
  channels: Parameters<typeof OrdersFilters>[0]['channels']
  isLoadingChannels: boolean
  isRefreshingChannels: boolean
  isRefreshingOrders: boolean
  onClear: () => void
  onSearchChange: OrdersPageProps['onSearchChange']
  search: OrdersPageProps['search']
}

export const OrdersToolbar = (props: OrdersToolbarProps) => (
  <>
    <OrdersFilters
      channels={props.channels}
      isLoadingChannels={props.isLoadingChannels}
      onClear={props.onClear}
      onSearchChange={props.onSearchChange}
      search={props.search}
    />
    <OrdersRefreshStatus
      channels={props.isRefreshingChannels}
      orders={props.isRefreshingOrders}
    />
  </>
)
