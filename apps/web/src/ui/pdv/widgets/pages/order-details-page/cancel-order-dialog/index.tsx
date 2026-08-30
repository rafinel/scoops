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
        <form className='space-y-5 p-6' onSubmit={handleSubmit}>
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
          <div>
            <label className='text-sm font-bold' htmlFor='cancel-reason'>
              Motivo do cancelamento (opcional)
            </label>
            <Textarea
              aria-describedby={fieldError ? 'cancel-reason-error' : undefined}
              aria-invalid={Boolean(fieldError)}
              className='mt-2 min-h-20 resize-y'
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
            <AlertDescription className='text-danger'>
              O pedido permanecerá no histórico com status Cancelado. O estoque consumido
              será restaurado quando o alvo atual existir; produtos, canal e valores
              registrados serão preservados.
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
