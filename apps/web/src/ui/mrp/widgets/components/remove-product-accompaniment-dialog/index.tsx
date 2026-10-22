import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/ui/shadcn/alert-dialog'

import { RemoveProductDialogHeader } from './remove-product-dialog-header'
import { useRemoveProductAccompanimentDialog } from './use-remove-product-accompaniment-dialog'

export type RemoveProductAccompanimentDialogProps = {
  item: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export const RemoveProductAccompanimentDialog = (
  props: RemoveProductAccompanimentDialogProps,
) => {
  const { item, onOpenChange, open, portionName } = props
  const { actionError, handleConfirm, isPending } = useRemoveProductAccompanimentDialog({
    itemId: item.id,
    onSuccess: props.onSuccess,
    productId: props.productId,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <RemoveProductDialogHeader
          accompanimentName={item.accompanimentProductName}
          portionName={portionName}
        />
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
