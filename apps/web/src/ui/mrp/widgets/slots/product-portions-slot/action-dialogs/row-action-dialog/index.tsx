import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentDialog } from '@/ui/mrp/widgets/components/product-accompaniment-dialog'
import { RemoveGlobalAccompanimentDialog } from '@/ui/mrp/widgets/components/remove-global-accompaniment-dialog'
import { RemoveProductAccompanimentDialog } from '@/ui/mrp/widgets/components/remove-product-accompaniment-dialog'

export type RowActionDialogProps = {
  item: AccompanimentPortionDetails
  kind: 'edit-row' | 'remove-row'
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const RowActionDialog = ({
  item,
  kind,
  onOpenChange,
  onSuccess,
}: RowActionDialogProps) => {
  if (kind === 'edit-row') {
    return (
      <ProductAccompanimentDialog
        item={item}
        mode='portion-row'
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
        portionName={item.portionProductName}
        productId={item.portionProductId}
      />
    )
  }

  return item.isGlobal ? (
    <RemoveGlobalAccompanimentDialog
      item={item}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      portionName={item.portionProductName}
      productId={item.portionProductId}
    />
  ) : (
    <RemoveProductAccompanimentDialog
      item={item}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      portionName={item.portionProductName}
      productId={item.portionProductId}
    />
  )
}
