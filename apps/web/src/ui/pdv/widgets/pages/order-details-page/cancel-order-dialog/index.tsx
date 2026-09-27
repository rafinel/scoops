import { Alert, AlertDescription } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  type CancelOrderDialogProps,
  useCancelOrderDialog,
} from './use-cancel-order-dialog'

export type { CancelOrderDialogProps }

export const CancelOrderDialog = ({
  onOpenChange,
  onSuccess,
  open,
  order,
}: CancelOrderDialogProps) => {
  const {
    errorMessage,
    fieldError,
    handleClose,
    handleSubmit,
    isCancelingOrder,
    register,
    watch,
  } = useCancelOrderDialog({ onOpenChange, onSuccess, open, order })
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent
        className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[500px]'
        showCloseButton={false}
      >
        <DialogHeader className='border-b border-border-soft p-6 pr-16'>
          <span className='grid size-11 place-items-center rounded-xl bg-danger-soft text-danger'>
            <Icon className='size-6' name='triangle-alert' />
          </span>
          <DialogTitle>Cancelar pedido?</DialogTitle>
          <DialogDescription>
            Confirme o cancelamento do pedido #
            {String(order.sequenceNumber).padStart(5, '0')}.
          </DialogDescription>
          <Button
            aria-label='Fechar cancelamento'
            className='absolute right-4 top-4 text-muted-foreground'
            onClick={handleClose}
            size='icon'
            type='button'
            variant='outline'
          >
            <Icon name='x' />
          </Button>
        </DialogHeader>
        <form className='space-y-4 p-6' onSubmit={handleSubmit}>
          <div className='flex items-center justify-between rounded-xl bg-muted p-4'>
            <div>
              <p className='font-extrabold'>
                Pedido #{String(order.sequenceNumber).padStart(5, '0')}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {formatDate(order.createdAt, { dateStyle: 'short', timeStyle: 'short' })}{' '}
                · {order.lines.length} produtos
              </p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>Total</p>
              <p className='text-lg font-extrabold'>{formatCurrency(order.total)}</p>
            </div>
          </div>
          <fieldset className='space-y-3'>
            <legend className='text-sm font-bold'>Destino do estoque por item</legend>
            <p className='text-xs leading-5 text-muted-foreground'>
              Cada escolha vale para todos os consumos deste item.
            </p>
            <div className='max-h-64 space-y-3 overflow-y-auto pr-1'>
              {order.lines.map((line, linePosition) => (
                <fieldset
                  className='rounded-xl border border-border-soft p-2'
                  key={`${line.product.productId}-${line.size?.sizeId ?? 'default'}-${line.brand?.brandId ?? 'no-brand'}-${line.baseUnitPrice}`}
                >
                  <legend className='px-1 text-sm font-bold'>{line.product.name}</legend>
                  <div className='grid grid-cols-2 gap-2'>
                    {LINE_DISPOSITION_OPTIONS.map((option) => (
                      <label
                        className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                          watch(`lineDispositions.${linePosition}.disposition`) ===
                          option.value
                            ? option.selectedClass
                            : UNSELECTED_DISPOSITION_CLASS
                        }`}
                        htmlFor={`cancel-line-${linePosition}-${option.value}`}
                        key={option.value}
                      >
                        <input
                          className={`size-4 shrink-0 ${
                            watch(`lineDispositions.${linePosition}.disposition`) ===
                            option.value
                              ? option.selectedInputClass
                              : 'accent-primary'
                          }`}
                          checked={
                            watch(`lineDispositions.${linePosition}.disposition`) ===
                            option.value
                          }
                          id={`cancel-line-${linePosition}-${option.value}`}
                          type='radio'
                          value={option.value}
                          {...register(
                            `lineDispositions.${linePosition}.disposition` as const,
                          )}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </fieldset>
          <div>
            <label className='text-sm font-bold' htmlFor='cancel-reason'>
              Motivo do cancelamento (opcional)
            </label>
            <Textarea
              aria-describedby={fieldError ? 'cancel-reason-error' : undefined}
              aria-invalid={Boolean(fieldError)}
              className='mt-2 min-h-12 resize-y'
              id='cancel-reason'
              maxLength={500}
              placeholder='Ex.: pedido duplicado'
              {...register('reason')}
            />
            {fieldError ? (
              <p
                className='mt-1 text-sm font-semibold text-danger'
                id='cancel-reason-error'
              >
                {fieldError}
              </p>
            ) : null}
          </div>
          <Alert className='border-danger/20 bg-danger-soft text-danger'>
            <Icon name='triangle-alert' />
            <AlertDescription className='text-xs leading-5 text-danger'>
              O pedido ficará no histórico como Cancelado. Devoluções exigem destino
              disponível; perdas não voltam ao estoque. Os dados da venda serão
              preservados.
            </AlertDescription>
          </Alert>
          {errorMessage ? (
            <p
              className='rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm font-semibold text-danger'
              role='alert'
            >
              {errorMessage}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6'>
            <Button
              disabled={isCancelingOrder}
              onClick={handleClose}
              type='button'
              variant='outline'
            >
              Voltar
            </Button>
            <Button
              className='bg-danger text-white hover:bg-danger/80'
              color='danger'
              disabled={isCancelingOrder}
              type='submit'
              variant='destructive'
            >
              {isCancelingOrder ? 'Cancelando…' : 'Cancelar pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const LINE_DISPOSITION_OPTIONS = [
  {
    value: 'return',
    label: 'Devolver ao estoque',
    selectedClass: '!border-success-soft bg-success-soft text-success',
    selectedInputClass: 'accent-success',
  },
  {
    value: 'loss',
    label: 'Registrar como perda',
    selectedClass: '!border-danger-soft bg-danger-soft text-danger',
    selectedInputClass: 'accent-danger',
  },
] as const

const UNSELECTED_DISPOSITION_CLASS =
  'border-border bg-card text-foreground hover:bg-muted'
