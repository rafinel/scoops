export type RemoveComboProductDialogProps = {
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  productName: string
  resolveFinalFocus: () => HTMLElement | null
}

export function useRemoveComboProductDialog({
  onConfirm,
  onOpenChange,
}: RemoveComboProductDialogProps) {
  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  function handleOpenChange(open: boolean) {
    onOpenChange(open)
  }

  return { handleConfirm, handleOpenChange }
}
