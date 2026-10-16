import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { RepricedOrderReviewHeader } from '../../../repriced-order-review-header'
import { RepricedOrderReviewSummary } from '../../../repriced-order-review-summary'

export type RepricedOrderReviewDetailsViewProps = {
  formatCurrency: (amount: number) => string
  hasAccompanimentPriceChange: boolean
  newTotal: number
  totalChange: OrderRegistrationChange | undefined
  valueChanges: readonly OrderRegistrationChange[]
}

export const RepricedOrderReviewDetailsView = ({
  formatCurrency,
  hasAccompanimentPriceChange,
  newTotal,
  totalChange,
  valueChanges,
}: RepricedOrderReviewDetailsViewProps) => (
  <>
    <RepricedOrderReviewHeader
      hasAccompanimentPriceChange={hasAccompanimentPriceChange}
    />
    <RepricedOrderReviewSummary
      formatCurrency={formatCurrency}
      newTotal={newTotal}
      totalChange={totalChange}
      valueChanges={valueChanges}
    />
  </>
)
