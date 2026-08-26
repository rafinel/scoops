import { useState } from 'react'

import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { DiscountStatus } from '@scoops/core/pdv/domain/structures'

import { useInactivateComboAction } from '@/ui/pdv/hooks/use-inactivate-combo-action'
import { useReactivateComboAction } from '@/ui/pdv/hooks/use-reactivate-combo-action'

export type ChangeComboStatusDialogProps = {
  combo: Combo
  expectedUpdatedAt: Date
  onSuccess: (message: string) => void | Promise<void>
  targetStatus: DiscountStatus
}

export function useChangeComboStatusDialog({
  combo,
  expectedUpdatedAt,
  onSuccess,
  targetStatus,
}: ChangeComboStatusDialogProps) {
  const { inactivateCombo, isPending: isInactivating } = useInactivateComboAction()
  const { isPending: isReactivating, reactivateCombo } = useReactivateComboAction()
  const [actionError, setActionError] = useState<string | null>(null)
  const isPending = isInactivating || isReactivating

  async function handleConfirm() {
    if (isPending) return
    setActionError(null)
    try {
      if (targetStatus === 'inactive') {
        await inactivateCombo({ comboId: combo.id, expectedUpdatedAt })
        await onSuccess('Combo inativado com sucesso.')
      } else {
        await reactivateCombo({ comboId: combo.id, expectedUpdatedAt })
        await onSuccess('Combo reativado com sucesso.')
      }
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível alterar o status do Combo. Tente novamente.',
      )
    }
  }

  return { actionError, handleConfirm, isPending }
}
