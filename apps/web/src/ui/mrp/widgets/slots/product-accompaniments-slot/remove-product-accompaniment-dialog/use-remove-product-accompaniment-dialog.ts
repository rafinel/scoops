import { useState } from 'react'

import { useRemoveProductAccompanimentAction } from '@/ui/mrp/hooks/use-remove-product-accompaniment-action'

export function useRemoveProductAccompanimentDialog({
  itemId,
  onSuccess,
  productId,
}: {
  itemId: string
  onSuccess: () => void
  productId: string
}) {
  const action = useRemoveProductAccompanimentAction(productId)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirm() {
    try {
      await action.removeProductAccompaniment(itemId)
      onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível remover. Tente novamente.',
      )
    }
  }

  return { actionError, handleConfirm, isPending: action.isPending }
}
