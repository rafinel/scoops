import { Button } from '@/ui/shadcn/button'
import { DialogFooter } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RepricedOrderReviewActionProps = {
  onReview: () => void
}

export const RepricedOrderReviewAction = ({
  onReview,
}: RepricedOrderReviewActionProps) => (
  <DialogFooter className='shrink-0 border-t border-border-soft p-6'>
    <Button onClick={onReview} type='button'>
      <Icon name='arrow-left' /> Revisar valores
    </Button>
  </DialogFooter>
)
