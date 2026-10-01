import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { OrderItems } from '../order-items'
import { OrderSummary } from '../order-summary'
import { OrderTotals } from '../order-totals'

export type OrderDetailsContentProps = { order: OrderDetails }

export const OrderDetailsContent = ({ order }: OrderDetailsContentProps) => (
  <div className='grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]'>
    <div className='min-w-0 xl:col-start-2 xl:row-start-1'>
      <OrderSummary order={order} />
    </div>
    <div className='min-w-0 space-y-5 xl:col-start-1 xl:row-start-1'>
      <OrderItems order={order} />
      <div className='hidden xl:block'>
        <OrderTotals order={order} />
      </div>
    </div>
  </div>
)
