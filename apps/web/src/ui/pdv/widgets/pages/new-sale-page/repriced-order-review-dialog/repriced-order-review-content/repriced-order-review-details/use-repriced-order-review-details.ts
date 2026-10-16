import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

import { useRepricedOrderReviewDialog } from '../../use-repriced-order-review-dialog'

export function useRepricedOrderReviewDetails(
  changes: readonly OrderRegistrationChange[],
) {
  const formatCurrency = useFormatCurrency()
  const { totalChange, valueChanges } = useRepricedOrderReviewDialog(changes)
  const hasAccompanimentPriceChange = changes.some(
    (change) => change.cause === 'accompaniment-price',
  )
  return { formatCurrency, hasAccompanimentPriceChange, totalChange, valueChanges }
}
