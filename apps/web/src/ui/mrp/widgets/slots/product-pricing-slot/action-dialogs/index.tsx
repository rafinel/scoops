import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

import { ProductSizeDialog } from '../product-size-dialog'
import { RemoveProductSizeDialog } from '../remove-product-size-dialog'
import type { ProductPricingAction } from '../use-product-pricing-slot'

export type ProductPricingActionDialogsProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
  productId: string
  selectedAction?: ProductPricingAction
  unit: string
}

export const ProductPricingActionDialogs = ({
  onOpenChange,
  onSuccess,
  productId,
  selectedAction,
  unit,
}: ProductPricingActionDialogsProps) => {
  if (selectedAction?.kind === 'add' || selectedAction?.kind === 'edit') {
    const size: ProductSizePricing | undefined =
      selectedAction.kind === 'edit' ? selectedAction.size : undefined
    return (
      <ProductSizeDialog
        isOpen
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        productId={productId}
        size={size}
        unit={unit}
      />
    )
  }

  return selectedAction?.kind === 'remove' ? (
    <RemoveProductSizeDialog
      isOpen
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      productId={productId}
      size={selectedAction.size}
    />
  ) : null
}
