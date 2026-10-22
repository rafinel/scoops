import type {
  GlobalAccompanimentDetails,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { Dialog, DialogContent } from '@/ui/shadcn/dialog'

import { ProductAccompanimentDialogActions } from './product-accompaniment-dialog-actions'
import type { ProductAccompanimentDialogMode } from './product-accompaniment-dialog-scope'
import { ProductAccompanimentDialogFields } from './product-accompaniment-dialog-fields'
import { ProductAccompanimentDialogHeader } from './product-accompaniment-dialog-header'
import { useProductAccompanimentDialog } from './use-product-accompaniment-dialog'

export type { ProductAccompanimentDialogMode }

export type ProductAccompanimentDialogProps = {
  accompaniment?: GlobalAccompanimentDetails
  hasIndividualLinks?: boolean
  item?: ProductAccompanimentDetails
  mode?: ProductAccompanimentDialogMode
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export const ProductAccompanimentDialog = (props: ProductAccompanimentDialogProps) => {
  const { item, onOpenChange, open } = props
  const { dialogCopy, fields, handleSubmit, isPending, isRefreshing } =
    useProductAccompanimentDialog(props)
  const { canSave, ...fieldProps } = fields

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <ProductAccompanimentDialogHeader
          description={dialogCopy.description}
          isRefreshing={isRefreshing}
          title={dialogCopy.title}
        />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          onSubmit={handleSubmit}
        >
          <ProductAccompanimentDialogFields {...fieldProps} item={item} />
          <ProductAccompanimentDialogActions
            canSave={canSave}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
            submitLabel={dialogCopy.submitLabel}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
