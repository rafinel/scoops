import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogContent, DialogFooter } from '@/ui/shadcn/dialog'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  type RepricedOrderReviewDialogProps,
  useRepricedOrderReviewDialog,
} from './use-repriced-order-review-dialog'
import { RepricedOrderReviewHeader } from './repriced-order-review-header'
import { RepricedOrderReviewSummary } from './repriced-order-review-summary'

export type { RepricedOrderReviewDialogProps }

export const RepricedOrderReviewDialog = ({
  changes,
  newTotal,
  onReview,
}: RepricedOrderReviewDialogProps) => {
  const { totalChange, valueChanges } = useRepricedOrderReviewDialog(changes)
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onReview())}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col sm:max-w-[560px]'>
        <RepricedOrderReviewHeader
          hasAccompanimentPriceChange={changes.some(
            (change) => change.cause === 'accompaniment-price',
          )}
        />
        <section
          aria-label='Resumo dos novos valores'
          className='min-h-0 flex-1 overflow-y-auto'
        >
          <RepricedOrderReviewSummary
            formatCurrency={formatCurrency}
            newTotal={newTotal}
            totalChange={totalChange}
            valueChanges={valueChanges}
          />
        </section>
        <DialogFooter className='shrink-0 border-t border-border-soft p-6'>
          <Button onClick={onReview} type='button'>
            <Icon name='arrow-left' /> Revisar valores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
