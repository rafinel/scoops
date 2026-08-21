import { useRemoveProductBrandAction } from '@/ui/mrp/hooks/use-remove-product-brand-action'
import { showErrorToast } from '@/ui/shared/notifications'

import type { RemoveProductBrandDialogProps } from '.'

export function useRemoveProductBrandDialog({
  brand,
  onOpenChange,
  onSuccess,
  productId,
}: RemoveProductBrandDialogProps) {
  const { error, isPending, removeProductBrand } = useRemoveProductBrandAction(productId)

  function handleOpenChange(open: boolean) {
    if (isPending) return
    onOpenChange(open)
  }

  async function handleConfirm() {
    try {
      await removeProductBrand(brand.brand.id)
      onOpenChange(false)
      onSuccess?.()
    } catch {
      showErrorToast(
        'Não foi possível excluir a marca. Corrija o impedimento e tente novamente.',
      )
    }
  }

  return { error, isPending, handleConfirm, handleOpenChange }
}
