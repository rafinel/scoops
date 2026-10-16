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
  const { fields, handleSubmit, isEdit, isPending, isRefreshing } =
    useProductAccompanimentDialog({ item, onSuccess, open, productId })
  const { canSave, ...fieldProps } = fields

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <ProductAccompanimentDialogHeader isEdit={isEdit} isRefreshing={isRefreshing} />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          onSubmit={handleSubmit}
        >
          <ProductAccompanimentDialogFields {...fieldProps} item={item} />
          <ProductAccompanimentDialogActions
            canSave={canSave}
            isEdit={isEdit}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
