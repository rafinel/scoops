import { Dialog } from '@/ui/shadcn/dialog'

import type { RepricedOrderReviewDialogProps } from './use-repriced-order-review-dialog'
import { RepricedOrderReviewContent } from './repriced-order-review-content'

export type { RepricedOrderReviewDialogProps }

export const RepricedOrderReviewDialog = (props: RepricedOrderReviewDialogProps) => (
  <Dialog
    open
    onOpenChange={(open) => {
      if (!open) props.onReview()
    }}
  >
    <RepricedOrderReviewContent {...props} />
  </Dialog>
)
