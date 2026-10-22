import { useState } from 'react'

import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

export type ProductPortionsAction =
  | { kind: 'link' | 'make-global' | 'edit-global' | 'remove-global' | 'make-individual' }
  | { kind: 'edit-row' | 'remove-row'; item: AccompanimentPortionDetails }

type SelectAction = (action: ProductPortionsAction) => void

function usePortionsPageActions(selectAction: SelectAction) {
  function handleLinkAction() {
    selectAction({ kind: 'link' })
  }
  function handleMakeGlobalAction() {
    selectAction({ kind: 'make-global' })
  }
  function handleEditGlobalAction() {
    selectAction({ kind: 'edit-global' })
  }
  function handleMakeIndividualAction() {
    selectAction({ kind: 'make-individual' })
  }
  function handleRemoveGlobalAction() {
    selectAction({ kind: 'remove-global' })
  }

  return {
    handleEditGlobalAction,
    handleLinkAction,
    handleMakeGlobalAction,
    handleMakeIndividualAction,
    handleRemoveGlobalAction,
  }
}

function usePortionsRowActions(selectAction: SelectAction) {
  function handleEditRowAction(item: AccompanimentPortionDetails) {
    selectAction({ kind: 'edit-row', item })
  }
  function handleRemoveRowAction(item: AccompanimentPortionDetails) {
    selectAction({ kind: 'remove-row', item })
  }

  return { handleEditRowAction, handleRemoveRowAction }
}

export function usePortionsActionState() {
  const [selectedAction, setSelectedAction] = useState<ProductPortionsAction>()
  const [hasBecomeGlobalNotice, setHasBecomeGlobalNotice] = useState(false)

  // Starting another action dismisses the status message of the previous recovery.
  function selectAction(action: ProductPortionsAction) {
    setHasBecomeGlobalNotice(false)
    setSelectedAction(action)
  }

  const pageActions = usePortionsPageActions(selectAction)
  const rowActions = usePortionsRowActions(selectAction)

  function handleActionClose() {
    setSelectedAction(undefined)
  }

  function handleBecameGlobalAction() {
    setSelectedAction(undefined)
    setHasBecomeGlobalNotice(true)
  }

  function handleActionOpenChange(open: boolean) {
    if (!open) handleActionClose()
  }

  return {
    ...pageActions,
    ...rowActions,
    closeHandlers: { handleActionClose, handleBecameGlobalAction },
    hasBecomeGlobalNotice,
    selectedAction,
    handleActionOpenChange,
  }
}
