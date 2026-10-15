import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

export type RepricedOrderReviewDialogProps = {
  changes: readonly OrderRegistrationChange[]
  newTotal: number
  onReview: () => void
}

export function useRepricedOrderReviewDialog({
  changes,
  newTotal,
  onReview,
}: RepricedOrderReviewDialogProps) {
  const totalChange = changes.find((change) => change.current.label === 'Total do pedido')
  const valueChanges = changes.filter(
    (change) => change.current.label !== 'Total do pedido',
  )
  const hasAccompanimentPriceChange = changes.some(
    (change) => change.cause === 'accompaniment-price',
  )

  function handleOpenChange(open: boolean) {
    if (!open) onReview()
  }

  function handleReview() {
    onReview()
  }

  return {
    handleOpenChange,
    handleReview,
    hasAccompanimentPriceChange,
    newTotal,
    totalChange,
    valueChanges,
  }
}
