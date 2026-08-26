import type { DiscountType } from '@scoops/core/pdv/domain/structures'

export type DiscountTypeDialogHookProps = {
  onChoose: (type: DiscountType) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function useDiscountTypeDialog({
  onChoose,
  onOpenChange,
  open,
}: DiscountTypeDialogHookProps) {
  function handleChooseCombo() {
    if (!open) return
    onChoose('combo')
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
  }

  return {
    handleChooseCombo,
    handleOpenChange,
  }
}
