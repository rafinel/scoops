import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentDialog } from '../product-accompaniment-dialog'
import { RemoveProductAccompanimentDialog } from '../remove-product-accompaniment-dialog'
import type { ProductAccompanimentsAction } from '../use-product-accompaniments-slot'

export type AccompanimentActionDialogsProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  productId: string
  selectedAction?: ProductAccompanimentsAction
}

export const AccompanimentActionDialogs = ({
  onOpenChange,
  onSuccess,
  productId,
  selectedAction,
}: AccompanimentActionDialogsProps) => {
  if (selectedAction?.kind === 'add' || selectedAction?.kind === 'edit') {
    const item: ProductAccompanimentDetails | undefined =
      selectedAction.kind === 'edit' ? selectedAction.item : undefined
    return (
      <ProductAccompanimentDialog
        item={item}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
        productId={productId}
      />
    )
  }

  return selectedAction?.kind === 'remove' ? (
    <RemoveProductAccompanimentDialog
      item={selectedAction.item}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      productId={productId}
    />
  ) : null
}
