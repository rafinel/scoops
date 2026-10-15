import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

export type RepricedOrderReviewDialogProps = {
  changes: readonly OrderRegistrationChange[]
  newTotal: number
  onReview: () => void
}

export const useRepricedOrderReviewDialog = (
  changes: readonly OrderRegistrationChange[],
) => ({
  totalChange: changes.find((change) => change.current.label === 'Total do pedido'),
  valueChanges: changes.filter((change) => change.current.label !== 'Total do pedido'),
})
