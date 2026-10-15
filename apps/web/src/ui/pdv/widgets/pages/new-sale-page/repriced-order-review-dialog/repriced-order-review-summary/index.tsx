import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { ChangedValuesCard } from './changed-values-card'
import { OrderTotalCard } from './order-total-card'

export type RepricedOrderReviewSummaryProps = {
  formatCurrency: (amount: number) => string
  newTotal: number
  totalChange: OrderRegistrationChange | undefined
  valueChanges: readonly OrderRegistrationChange[]
}

export const RepricedOrderReviewSummary = ({
  formatCurrency,
  newTotal,
  totalChange,
  valueChanges,
}: RepricedOrderReviewSummaryProps) => (
  <div aria-atomic='true' aria-live='polite' className='space-y-3 p-6' role='status'>
    <ChangedValuesCard formatCurrency={formatCurrency} valueChanges={valueChanges} />
    <OrderTotalCard
      formatCurrency={formatCurrency}
      newTotal={newTotal}
      totalChange={totalChange}
    />
    <p className='text-sm text-muted-foreground'>
      Revise os novos valores e confirme o pedido novamente.
    </p>
  </div>
)
