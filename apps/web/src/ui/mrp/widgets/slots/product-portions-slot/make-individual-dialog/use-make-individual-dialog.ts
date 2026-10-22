import { useEffect, useState } from 'react'

import { useRemoveGlobalAccompanimentAction } from '@/ui/mrp/hooks/use-remove-global-accompaniment-action'

export type UseMakeIndividualDialogProps = {
  onSuccess: () => void
  open: boolean
  productId: string
}

export function useMakeIndividualDialog({
  onSuccess,
  open,
  productId,
}: UseMakeIndividualDialogProps) {
  const { isPending, removeGlobalAccompaniment } =
    useRemoveGlobalAccompanimentAction(productId)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setActionError(null)
  }, [open])

  async function handleConfirm() {
    try {
      await removeGlobalAccompaniment({ keepPortionLinks: true })
      onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível converter. Tente novamente.',
      )
    }
  }

  return { actionError, isPending, handleConfirm }
}
