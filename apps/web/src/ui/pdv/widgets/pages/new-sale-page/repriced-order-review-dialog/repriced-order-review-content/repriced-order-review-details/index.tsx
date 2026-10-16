import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { useRepricedOrderReviewDetails } from './use-repriced-order-review-details'
import { RepricedOrderReviewDetailsView } from './repriced-order-review-details-view'

export type RepricedOrderReviewDetailsProps = {
  changes: readonly OrderRegistrationChange[]
  newTotal: number
}

export const RepricedOrderReviewDetails = (props: RepricedOrderReviewDetailsProps) => {
  const details = useRepricedOrderReviewDetails(props.changes)
  return <RepricedOrderReviewDetailsView details={details} newTotal={props.newTotal} />
}
