import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

export type RepricedOrderReviewDialogProps = {
  changes: readonly OrderRegistrationChange[]
  newTotal: number
  onReview: () => void
}

export function useRepricedOrderReviewDialog(
  changes: readonly OrderRegistrationChange[],
) {
  return {
    totalChange: changes.find((change) => change.current.label === 'Total do pedido'),
    valueChanges: changes.filter((change) => change.current.label !== 'Total do pedido'),
  }
}
