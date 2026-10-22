import { useEffect, useState } from 'react'

import { AccompanimentRemovalScope } from '@scoops/core/mrp/domain/structures'

import { useRemoveGlobalAccompanimentAction } from '@/ui/mrp/hooks/use-remove-global-accompaniment-action'
import { useRemoveProductAccompanimentAction } from '@/ui/mrp/hooks/use-remove-product-accompaniment-action'

export type UseRemoveGlobalAccompanimentDialogProps = {
  isScopeLocked?: boolean
  itemId?: string
  itemName: string
  onSuccess: () => void
  open: boolean
  portionName?: string
  productId: string
}

function useRemovalChoice(open: boolean, isScopeLocked: boolean) {
  const [removeAllChoice, setRemoveAllChoice] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRemoveAllChoice(false)
    setActionError(null)
  }, [open])

  function handleRemoveAllChange(checked: boolean) {
    if (isScopeLocked) return
    setRemoveAllChoice(checked)
    setActionError(null)
  }

  return {
    actionError,
    removeAll: isScopeLocked || removeAllChoice,
    setActionError,
    handleRemoveAllChange,
  }
}

export function useRemoveGlobalAccompanimentDialog(
  props: UseRemoveGlobalAccompanimentDialogProps,
) {
  const { isScopeLocked = false, itemId, itemName, portionName, productId } = props
  const rowAction = useRemoveProductAccompanimentAction(productId)
  const globalAction = useRemoveGlobalAccompanimentAction(productId)
  const { removeAll, setActionError, ...choice } = useRemovalChoice(
    props.open,
    isScopeLocked,
  )
  const isPending = rowAction.isPending || globalAction.isPending

  async function handleConfirm() {
    try {
      if (isScopeLocked || itemId === undefined) {
        await globalAction.removeGlobalAccompaniment()
      } else {
        await rowAction.removeProductAccompaniment(itemId, getScope(removeAll))
      }
      props.onSuccess()
    } catch (caught) {
      setActionError(getErrorMessage(caught))
    }
  }

  return {
    ...choice,
    actionLabel: getActionLabel(removeAll, isPending),
    consequence: getConsequence(removeAll, itemName, isScopeLocked),
    description: getDescription(itemName, isScopeLocked),
    helpText: getHelpText(removeAll, itemName, portionName),
    isPending,
    isScopeLocked,
    removeAll,
    handleConfirm,
  }
}

function getScope(removeAll: boolean) {
  return removeAll ? AccompanimentRemovalScope.All : AccompanimentRemovalScope.Portion
}

function getErrorMessage(caught: unknown) {
  return caught instanceof Error
    ? caught.message
    : 'Não foi possível remover. Tente novamente.'
}

function getActionLabel(removeAll: boolean, isPending: boolean) {
  if (isPending) return 'Removendo…'
  return removeAll ? 'Remover de todas' : 'Remover desta porção'
}

function getDescription(itemName: string, isScopeLocked: boolean) {
  return isScopeLocked
    ? `${itemName} é um acompanhamento global e será removido de todas as porções.`
    : `${itemName} é um acompanhamento global. Escolha onde ele deve ser removido.`
}

function getHelpText(removeAll: boolean, itemName: string, portionName?: string) {
  if (removeAll) return `${itemName} deixa de ser global.`
  return `Desligado: remove apenas ${portionName ? `de ${portionName}` : 'desta porção'}.`
}

function getConsequence(removeAll: boolean, itemName: string, isScopeLocked: boolean) {
  if (isScopeLocked) {
    return 'Será removido de todas as porções. Novas porções não o receberão. Os saldos de estoque não mudam.'
  }
  if (removeAll) {
    return 'Será removido de todas as porções, incluindo esta. Novas porções não o receberão. Os saldos de estoque não mudam.'
  }
  return `${itemName} continua nas outras porções e nas novas. Você pode vinculá-lo de novo a esta porção depois. Os saldos de estoque não mudam.`
}
