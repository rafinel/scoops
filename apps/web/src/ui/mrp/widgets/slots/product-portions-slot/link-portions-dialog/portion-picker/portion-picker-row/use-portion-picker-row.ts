import type { KeyboardEvent } from 'react'

import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'
import { ProductStatus } from '@scoops/core/mrp/domain/structures'

export type UsePortionPickerRowProps = {
  candidate: AccompanimentPortionCandidate
  isSelected: boolean
  onToggle: (portionProductId: string, isSelected: boolean) => void
}

export function usePortionPickerRow({
  candidate,
  isSelected,
  onToggle,
}: UsePortionPickerRowProps) {
  const portionProductId = candidate.productId

  function handleCheckedChange(checked: boolean) {
    onToggle(portionProductId, checked)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onToggle(portionProductId, !isSelected)
  }

  return {
    isActive: candidate.status === ProductStatus.Active,
    nameId: `portion-picker-name-${portionProductId}`,
    statusId: `portion-picker-status-${portionProductId}`,
    handleCheckedChange,
    handleKeyDown,
  }
}
