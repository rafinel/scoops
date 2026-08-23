import { useState } from 'react'

import { useRemoveAccompanimentTypeAction } from '@/ui/mrp/hooks/use-remove-accompaniment-type-action'

export function useRemoveAccompanimentTypeDialog({
  onSuccess,
  typeId,
}: {
  onSuccess: () => void
  typeId: string
}) {
  const action = useRemoveAccompanimentTypeAction()
  const [actionError, setActionError] = useState<string | null>(null)
  async function handleConfirm() {
    try {
      await action.removeAccompanimentType(typeId)
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
