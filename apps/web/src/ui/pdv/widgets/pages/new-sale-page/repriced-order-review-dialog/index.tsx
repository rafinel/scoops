import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  type RepricedOrderReviewDialogProps,
  useRepricedOrderReviewDialog,
} from './use-repriced-order-review-dialog'

export type { RepricedOrderReviewDialogProps }

export const RepricedOrderReviewDialog = ({
  changes,
  newTotal,
  onReview,
}: RepricedOrderReviewDialogProps) => {
  const {
    handleOpenChange,
    handleReview,
    hasAccompanimentPriceChange,
    totalChange,
    valueChanges,
  } = useRepricedOrderReviewDialog({ changes, newTotal, onReview })
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className='w-[calc(100vw-2rem)] sm:max-w-[560px]'>
        <DialogHeader className='border-b border-border-soft p-6 pr-16'>
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
        <div
          aria-atomic='true'
          aria-live='polite'
          className='space-y-3 p-6'
          role='status'
        >
          <section className='rounded-xl border !border-warning bg-warning-soft p-3 text-sm text-warning'>
            <div className='flex items-start gap-3'>
              <span className='grid size-9 shrink-0 place-items-center rounded-lg border !border-warning bg-card'>
                <Icon className='size-4' name='tag' />
              </span>
              <div className='min-w-0'>
                <p className='text-xs font-extrabold uppercase'>Preço atualizado</p>
                {valueChanges.length > 0 ? (
                  <ul className='mt-1 grid gap-1'>
                    {valueChanges.map((change, index) => (
                      <li
                        className={
                          index === 0
                            ? 'font-extrabold'
                            : 'text-xs font-normal text-muted-foreground'
                        }
                        key={`${change.kind}-${change.previous.label}-${change.current.label}-${change.previous.amount}-${change.current.amount}`}
                      >
                        {change.previous.label !== change.current.label
                          ? `${change.previous.label} → ${change.current.label}`
                          : change.current.label}
                        {': '}
                        {formatCurrency(change.previous.amount)} →{' '}
                        {formatCurrency(change.current.amount)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='mt-1 font-extrabold'>
                    Os valores do pedido foram atualizados.
                  </p>
                )}
              </div>
            </div>
          </section>
          <section className='rounded-xl border !border-warning bg-warning-soft p-3 text-sm text-warning'>
            <div className='flex items-start gap-3'>
              <span className='grid size-9 shrink-0 place-items-center rounded-lg border !border-warning bg-card'>
                <Icon className='size-4' name='package' />
              </span>
              <div className='min-w-0'>
                <p className='text-xs font-extrabold uppercase'>Total do pedido</p>
                <p className='mt-1 font-extrabold'>
                  {totalChange
                    ? `${formatCurrency(totalChange.previous.amount)} → ${formatCurrency(totalChange.current.amount)}`
                    : formatCurrency(newTotal)}
                </p>
                <p className='mt-1 text-xs'>O pedido ainda não foi registrado.</p>
              </div>
            </div>
          </section>
          <p className='text-sm text-muted-foreground'>
            Revise os novos valores e confirme o pedido novamente.
          </p>
        </div>
        <DialogFooter className='border-t border-border-soft p-6'>
          <Button onClick={handleReview} type='button'>
            <Icon name='arrow-left' /> Revisar valores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
