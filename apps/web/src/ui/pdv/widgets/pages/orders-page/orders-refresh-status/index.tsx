import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'

export type OrdersRefreshStatusProps = {
  channels: boolean
  orders: boolean
}

export const OrdersRefreshStatus = (props: OrdersRefreshStatusProps) => (
  <div className='flex flex-wrap gap-4'>
    <PageRefreshStatus
      isRefreshing={props.channels}
      label='Atualizando canais de venda…'
    />
    <PageRefreshStatus isRefreshing={props.orders} label='Atualizando pedidos…' />
  </div>
)
