import { useState } from 'react'

import type { Combo } from '@scoops/core/pdv/domain/entities'

import { useDeleteComboAction } from '@/ui/pdv/hooks/use-delete-combo-action'

export type DeleteComboDialogHookProps = {
  combo: Combo
  expectedUpdatedAt: Date
  onSuccess: () => void | Promise<void>
}

export function useDeleteComboDialog({
  combo,
  expectedUpdatedAt,
  onSuccess,
}: DeleteComboDialogHookProps) {
  const { deleteCombo, isPending } = useDeleteComboAction()
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirm() {
    if (isPending) return
    setActionError(null)
    try {
      await deleteCombo({ comboId: combo.id, expectedUpdatedAt })
      await onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível excluir o Combo. Tente novamente.',
      )
    }
  }

  return { actionError, handleConfirm, isPending }
}
