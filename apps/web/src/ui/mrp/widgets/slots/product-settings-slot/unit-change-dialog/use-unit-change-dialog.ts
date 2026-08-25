import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { useChangeProductUnitAction } from '@/ui/mrp/hooks/use-change-product-unit-action'
import { usePreviewProductUnitChangeQuery } from '@/ui/mrp/hooks/use-preview-product-unit-change-query'
import { showErrorToast } from '@/ui/shared/notifications'

export type UnitChangeDialogProps = {
  currentUnit: ProductUnit
  onOpenChange: (open: boolean) => void
  open: boolean
  product: Product
  targetUnit: ProductUnit
}

export function useUnitChangeDialog(props: UnitChangeDialogProps) {
  const preview = usePreviewProductUnitChangeQuery(
    props.product.id,
    props.targetUnit,
    props.open,
  )
  const action = useChangeProductUnitAction(props.product.id)

  async function handleConfirm() {
    if (!preview.unitChangePreview) return
    try {
      await action.changeProductUnit({
        targetUnit: props.targetUnit,
        expectedUpdatedAt: props.product.updatedAt,
      })
      props.onOpenChange(false)
    } catch {
      showErrorToast('Não foi possível alterar a unidade. Tente novamente.')
    }
  }

  function handleOpenChange(open: boolean) {
    if (action.isChangingProductUnit) return
    props.onOpenChange(open)
  }

  return {
    ...preview,
    changeProductUnitError: action.changeProductUnitError,
    handleConfirm,
    handleOpenChange,
    isChangingProductUnit: action.isChangingProductUnit,
  }
}
