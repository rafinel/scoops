import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RepricedOrderReviewHeaderProps = {
  hasAccompanimentPriceChange: boolean
}

export const RepricedOrderReviewHeader = ({
  hasAccompanimentPriceChange,
}: RepricedOrderReviewHeaderProps) => (
  <DialogHeader className='shrink-0 border-b border-border-soft p-6 pr-16'>
    <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-warning-soft text-warning'>
      <Icon className='size-6' name='triangle-alert' />
    </span>
    <DialogTitle>Revise os preços</DialogTitle>
    <DialogDescription className='text-xs'>
      {hasAccompanimentPriceChange
        ? 'O preço de um acompanhamento mudou antes do registro.'
        : 'O pedido mudou antes do registro.'}
    </DialogDescription>
  </DialogHeader>
)
