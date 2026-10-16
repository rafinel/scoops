import { DialogContent } from '@/ui/shadcn/dialog'

import type { RepricedOrderReviewDialogProps } from '../use-repriced-order-review-dialog'
import { RepricedOrderReviewAction } from './repriced-order-review-action'
import { RepricedOrderReviewDetails } from './repriced-order-review-details'

export type RepricedOrderReviewContentProps = {
  changes: RepricedOrderReviewDialogProps['changes']
  newTotal: number
  onReview: RepricedOrderReviewDialogProps['onReview']
}

export const RepricedOrderReviewContent = ({
  changes,
  newTotal,
  onReview,
}: RepricedOrderReviewContentProps) => (
  <DialogContent className='flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col sm:max-w-[560px]'>
    <RepricedOrderReviewDetails changes={changes} newTotal={newTotal} />
    <RepricedOrderReviewAction onReview={onReview} />
  </DialogContent>
)
