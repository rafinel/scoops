import { useEffect, useState } from 'react'

import { AccompanimentRemovalScope } from '@scoops/core/mrp/domain/structures'

import { useRemoveProductAccompanimentAction } from '@/ui/mrp/hooks/use-remove-product-accompaniment-action'

export type UseRemoveGlobalAccompanimentDialogProps = {
  itemId: string
  itemName: string
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

export function useRemoveGlobalAccompanimentDialog({
  itemId,
  itemName,
  onSuccess,
  open,
  portionName,
  productId,
}: UseRemoveGlobalAccompanimentDialogProps) {
  const action = useRemoveProductAccompanimentAction(productId)
  const [removeAll, setRemoveAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRemoveAll(false)
    setActionError(null)
  }, [open])

  function handleRemoveAllChange(checked: boolean) {
    setRemoveAll(checked)
    setActionError(null)
  }

  async function handleConfirm() {
    try {
      await action.removeProductAccompaniment(
        itemId,
        removeAll ? AccompanimentRemovalScope.All : AccompanimentRemovalScope.Portion,
      )
      onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível remover. Tente novamente.',
      )
    }
  }

  return {
    actionError,
    actionLabel: getActionLabel(removeAll, action.isPending),
    consequence: getConsequence(removeAll, itemName),
    helpText: getHelpText(removeAll, itemName, portionName),
    isPending: action.isPending,
    removeAll,
    handleConfirm,
    handleRemoveAllChange,
  }
}

function getActionLabel(removeAll: boolean, isPending: boolean) {
  if (isPending) return 'Removendo…'
  return removeAll ? 'Remover de todas' : 'Remover desta porção'
}

function getHelpText(removeAll: boolean, itemName: string, portionName?: string) {
  if (removeAll) return `${itemName} deixa de ser global.`
  return `Desligado: remove apenas ${portionName ? `de ${portionName}` : 'desta porção'}.`
}

function getConsequence(removeAll: boolean, itemName: string) {
  if (removeAll) {
    return 'Será removido de todas as porções, incluindo esta. Novas porções não o receberão. Os saldos de estoque não mudam.'
  }
  return `${itemName} continua nas outras porções e nas novas. Você pode vinculá-lo de novo a esta porção depois. Os saldos de estoque não mudam.`
}
