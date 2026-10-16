import { Dialog } from '@/ui/shadcn/dialog'

import type { RepricedOrderReviewDialogProps } from './use-repriced-order-review-dialog'
import { RepricedOrderReviewContent } from './repriced-order-review-content'

export type { RepricedOrderReviewDialogProps }

export const RepricedOrderReviewDialog = (props: RepricedOrderReviewDialogProps) => (
  <Dialog open onOpenChange={getOpenChangeHandler(props.onReview)}>
    <RepricedOrderReviewContent {...props} />
  </Dialog>
)

function getOpenChangeHandler(onReview: () => void) {
  return (open: boolean) => {
    if (!open) onReview()
  }
}
