import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

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

import { useRemoveProductSizeDialog } from './use-remove-product-size-dialog'

export type RemoveProductSizeDialogProps = {
  isOpen: boolean
  productId: string
  size: ProductSizePricing
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export const RemoveProductSizeDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
  productId,
  size,
}: RemoveProductSizeDialogProps) => {
  const { formError, handleConfirm, isPending } = useRemoveProductSizeDialog({
    isOpen,
    onOpenChange,
    onSuccess,
    productId,
    sizeId: size.size.id,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader className='border-b border-border-soft p-5 pr-14 sm:p-6 sm:pr-14'>
          <span className='grid size-11 place-items-center rounded-xl bg-danger-soft text-danger'>
            <Icon name='trash-2' />
          </span>
          <DialogTitle className='mt-1'>Remover tamanho?</DialogTitle>
          <DialogDescription>
            Esta ação remove <strong>{size.size.name}</strong> e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 p-5 sm:p-6'>
          <p className='rounded-xl bg-muted p-4 text-sm text-muted-foreground'>
            O tamanho não será oferecido em vendas futuras. Histórico de pedidos não será
            alterado.
          </p>
          {formError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {formError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          <Button
            className='bg-destructive text-destructive-foreground shadow-destructive hover:bg-destructive/80'
            disabled={isPending}
            onClick={() => void handleConfirm()}
            type='button'
          >
            <Icon name='trash-2' /> {isPending ? 'Removendo…' : 'Remover tamanho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
