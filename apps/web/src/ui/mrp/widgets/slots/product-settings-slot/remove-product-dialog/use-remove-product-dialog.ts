import type { Product } from '@scoops/core/mrp/domain/entities'

import { useProductRemovalImpactQuery } from '@/ui/mrp/hooks/use-product-removal-impact-query'
import { useRemoveProductAction } from '@/ui/mrp/hooks/use-remove-product-action'
import { showErrorToast } from '@/ui/shared/notifications'

export type RemoveProductDialogProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  product: Product
}

export function useRemoveProductDialog({
  onOpenChange,
  open,
  product,
}: RemoveProductDialogProps) {
  const impact = useProductRemovalImpactQuery(product.id, open)
  const action = useRemoveProductAction(product.id)

  async function handleConfirm() {
    try {
      await action.removeProduct()
    } catch {
      showErrorToast('Não foi possível remover o produto. Tente novamente.')
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (action.isRemovingProduct) return
    onOpenChange(nextOpen)
  }

  return {
    ...impact,
    handleConfirm,
    handleOpenChange,
    isRemovingProduct: action.isRemovingProduct,
    removeProductError: action.removeProductError,
  }
}
