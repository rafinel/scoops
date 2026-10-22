import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentDialog } from '@/ui/mrp/widgets/components/product-accompaniment-dialog'
import { RemoveGlobalAccompanimentDialog } from '@/ui/mrp/widgets/components/remove-global-accompaniment-dialog'
import { RemoveProductAccompanimentDialog } from '@/ui/mrp/widgets/components/remove-product-accompaniment-dialog'

import type { ProductAccompanimentsAction } from '../use-product-accompaniments-slot'

export type AccompanimentActionDialogsProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  portionName?: string
  productId: string
  selectedAction?: ProductAccompanimentsAction
}

export const AccompanimentActionDialogs = ({
  onOpenChange,
  onSuccess,
  portionName,
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

  if (selectedAction?.kind !== 'remove') return null

  return selectedAction.item.isGlobal ? (
    <RemoveGlobalAccompanimentDialog
      item={selectedAction.item}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      portionName={portionName}
      productId={productId}
    />
  ) : (
    <RemoveProductAccompanimentDialog
      item={selectedAction.item}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      productId={productId}
    />
  )
}
