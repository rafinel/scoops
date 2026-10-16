import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { RepricedOrderReviewHeader } from '../../../repriced-order-review-header'
import { RepricedOrderReviewSummary } from '../../../repriced-order-review-summary'

export type RepricedOrderReviewDetailsModel = {
  formatCurrency: (amount: number) => string
  hasAccompanimentPriceChange: boolean
  totalChange: OrderRegistrationChange | undefined
  valueChanges: readonly OrderRegistrationChange[]
}

export type RepricedOrderReviewDetailsViewProps = {
  details: RepricedOrderReviewDetailsModel
  newTotal: number
}

export const RepricedOrderReviewDetailsView = ({
  details,
  newTotal,
}: RepricedOrderReviewDetailsViewProps) => (
  <>
    <RepricedOrderReviewHeader
      hasAccompanimentPriceChange={details.hasAccompanimentPriceChange}
    />
    <RepricedOrderReviewSummary
      formatCurrency={details.formatCurrency}
      newTotal={newTotal}
      totalChange={details.totalChange}
      valueChanges={details.valueChanges}
    />
  </>
)
