import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Dialog, DialogContent } from '@/ui/shadcn/dialog'

import { ProductAccompanimentDialogActions } from './product-accompaniment-dialog-actions'
import { ProductAccompanimentDialogFields } from './product-accompaniment-dialog-fields'
import { ProductAccompanimentDialogHeader } from './product-accompaniment-dialog-header'
import { useProductAccompanimentDialog } from './use-product-accompaniment-dialog'

export type ProductAccompanimentDialogProps = {
  item?: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const ProductAccompanimentDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
  productId,
}: ProductAccompanimentDialogProps) => {
  const state = useProductAccompanimentDialog({ item, onSuccess, open, productId })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <ProductAccompanimentDialogHeader
          isEdit={state.isEdit}
          isRefreshing={state.isRefreshing}
        />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          onSubmit={state.handleSubmit}
        >
          <ProductAccompanimentDialogFields item={item} state={state} />
          <ProductAccompanimentDialogActions
            canSave={state.canSave}
            isEdit={state.isEdit}
            isPending={state.isPending}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
