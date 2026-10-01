import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'

import {
  OrderDetailsActions,
  type OrderDetailsActionsProps,
} from '../order-details-actions'
import {
  OrderDetailsHeading,
  type OrderDetailsHeadingProps,
} from '../order-details-heading'

export type OrderDetailsBodyProps = {
  isRefreshing: boolean
  sequence: OrderDetailsHeadingProps['sequence']
  isCanceled: OrderDetailsActionsProps['isCanceled']
  timestamp: OrderDetailsActionsProps['timestamp']
  printAction: OrderDetailsActionsProps['printAction']
  canCancel: OrderDetailsActionsProps['canCancel']
  onBack: OrderDetailsHeadingProps['onBack']
  onOpenCancel: OrderDetailsActionsProps['onOpenCancel']
}

export const OrderDetailsBody = (props: OrderDetailsBodyProps) => (
  <>
    <PageRefreshStatus isRefreshing={props.isRefreshing} label='Atualizando pedido…' />
    <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <OrderDetailsHeading {...props} />
      <OrderDetailsActions {...props} />
    </header>
  </>
)
