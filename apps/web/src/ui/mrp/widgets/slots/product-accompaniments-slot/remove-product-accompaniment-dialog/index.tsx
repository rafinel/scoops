import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useRemoveProductAccompanimentDialog } from './use-remove-product-accompaniment-dialog'

export type RemoveProductAccompanimentDialogProps = {
  item: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const RemoveProductAccompanimentDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
  productId,
}: RemoveProductAccompanimentDialogProps) => {
  const { actionError, handleConfirm, isPending } = useRemoveProductAccompanimentDialog({
    itemId: item.id,
    onSuccess,
    productId,
  })
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className='p-6'>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Remover acompanhamento?</AlertDialogTitle>
          <AlertDialogDescription>
            O vínculo de {item.accompanimentProductName} será removido. O estoque e o
            histórico permanecem intactos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {actionError ? (
          <p className='px-6 pb-4 text-sm font-semibold text-destructive' role='alert'>
            {actionError}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
            className='border border-destructive/40 bg-background text-destructive hover:bg-destructive/5 hover:text-destructive'
            variant='destructive'
          >
            {isPending ? 'Removendo…' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
