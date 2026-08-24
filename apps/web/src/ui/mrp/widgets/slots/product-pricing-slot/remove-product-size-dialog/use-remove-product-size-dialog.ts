import { useEffect, useState } from 'react'

import { useRemoveProductSizeAction } from '@/ui/mrp/hooks/use-remove-product-size-action'

export type UseRemoveProductSizeDialogProps = {
  isOpen: boolean
  productId: string
  sizeId: string
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function useRemoveProductSizeDialog({
  isOpen,
  productId,
  sizeId,
  onOpenChange,
  onSuccess,
}: UseRemoveProductSizeDialogProps) {
  const action = useRemoveProductSizeAction(productId)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) setFormError(null)
  }, [isOpen])

  async function handleConfirm() {
    setFormError(null)
    try {
      await action.removeProductSize(sizeId)
      onOpenChange(false)
      await onSuccess()
    } catch (caught) {
      setFormError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Não foi possível remover o tamanho. Tente novamente.',
      )
    }
  }

  return {
    formError,
    handleConfirm,
    isPending: action.isPending,
  }
}
