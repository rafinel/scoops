import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { PortionPickerBox } from './portion-picker-box'
import { PortionPickerHeader } from './portion-picker-header'
import { usePortionPicker } from './use-portion-picker'

export type PortionPickerProps = {
  candidates: readonly AccompanimentPortionCandidate[]
  error?: string
  isError: boolean
  isLoading: boolean
  onRetry: () => void
  onSelectedIdsChange: (portionProductIds: string[]) => void
  selectedIds: readonly string[]
}

export const PortionPicker = (props: PortionPickerProps) => {
  const { error, isError, isLoading, onRetry } = props
  const {
    areAllFilteredSelected,
    labelId,
    showsToggleAll,
    handleToggleAll,
    ...boxState
  } = usePortionPicker(props)

  return (
    <div className='grid gap-2'>
      <PortionPickerHeader
        areAllFilteredSelected={areAllFilteredSelected}
        labelId={labelId}
        onToggleAll={handleToggleAll}
        showsToggleAll={showsToggleAll}
      />
      <PortionPickerBox
        {...boxState}
        isError={isError}
        isLoading={isLoading}
        labelId={labelId}
        onRetry={onRetry}
      />
      {error ? (
        <span className='text-sm font-semibold text-destructive'>{error}</span>
      ) : null}
    </div>
  )
}
