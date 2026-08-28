import type { Cart } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

export type OrderRegistrationDialogProps = {
  cart?: Cart
  isOpen: boolean
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export const OrderRegistrationDialog = ({
  cart,
  isOpen,
  isPending,
  onConfirm,
  onOpenChange,
}: OrderRegistrationDialogProps) => {
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader className='border-b border-border-soft p-6 pr-16'>
          <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='clipboard-list' className='size-6' />
          </span>
          <DialogTitle>Confirmar pedido</DialogTitle>
          <DialogDescription>
            Revise os valores antes de registrar a venda.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3 p-6'>
          {cart ? (
            <>
              <div className='flex justify-between gap-4 text-sm'>
                <span className='text-muted-foreground'>Itens</span>
                <strong>
                  {cart.lines.reduce((total, line) => total + line.quantity, 0)}
                </strong>
              </div>
              <div className='flex justify-between gap-4 text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <strong>{formatCurrency(cart.subtotal)}</strong>
              </div>
              <div className='flex justify-between gap-4 border-t border-border-soft pt-3'>
                <span className='font-extrabold'>Total</span>
                <strong className='text-2xl font-black'>
                  {formatCurrency(cart.total)}
                </strong>
              </div>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Atualizando os valores do pedido…
            </p>
          )}
        </div>
        <DialogFooter className='sm:flex-row sm:justify-end'>
          <Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
            Cancelar
          </Button>
          <Button disabled={!cart || isPending} onClick={onConfirm} type='button'>
            {isPending ? 'Registrando…' : 'Confirmar registro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
