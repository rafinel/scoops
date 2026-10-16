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
  <section aria-label='Resumo dos novos valores' className='flex min-h-0 flex-1 flex-col'>
    <div
      aria-label='Valores atualizados'
      aria-atomic='true'
      aria-live='polite'
      className='min-h-0 flex-1 overflow-y-auto p-6 pb-3'
      role='status'
    >
      <ChangedValuesCard formatCurrency={formatCurrency} valueChanges={valueChanges} />
    </div>
    <div className='shrink-0 space-y-3 px-6 pb-3'>
      <OrderTotalCard
        formatCurrency={formatCurrency}
        newTotal={newTotal}
        totalChange={totalChange}
      />
      <p className='text-sm text-muted-foreground'>
        Revise os novos valores e confirme o pedido novamente.
      </p>
    </div>
  </section>
)
