import { useState } from 'react'

export function useSalesEvolution() {
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)

  function handleOpenTableDialog() {
    setIsTableDialogOpen(true)
  }

  function handleTableDialogOpenChange(isOpen: boolean) {
    setIsTableDialogOpen(isOpen)
  }

  return {
    isTableDialogOpen,
    handleOpenTableDialog,
    handleTableDialogOpenChange,
  }
}
