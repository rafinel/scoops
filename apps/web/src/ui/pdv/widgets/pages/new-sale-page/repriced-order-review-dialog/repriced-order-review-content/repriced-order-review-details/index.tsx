import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { useRepricedOrderReviewDetails } from './use-repriced-order-review-details'
import { RepricedOrderReviewDetailsView } from './repriced-order-review-details-view'

export type RepricedOrderReviewDetailsProps = {
  changes: readonly OrderRegistrationChange[]
  newTotal: number
}

export const RepricedOrderReviewDetails = ({
  changes,
  newTotal,
}: RepricedOrderReviewDetailsProps) => {
  const { formatCurrency, hasAccompanimentPriceChange, totalChange, valueChanges } =
    useRepricedOrderReviewDetails(changes)

  return (
    <RepricedOrderReviewDetailsView
      formatCurrency={formatCurrency}
      hasAccompanimentPriceChange={hasAccompanimentPriceChange}
      newTotal={newTotal}
      totalChange={totalChange}
      valueChanges={valueChanges}
    />
  )
}
