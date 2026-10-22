import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { PortionPickerRows } from './portion-picker-rows'
import { PortionPickerStatus } from './portion-picker-status'

const SCROLL_AREA_CLASS = [
  'max-h-[246px] overflow-y-auto',
  '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--border)]',
  'supports-[-moz-appearance:none]:[scrollbar-color:var(--border)_transparent] supports-[-moz-appearance:none]:[scrollbar-width:thin]',
].join(' ')

export type PortionPickerListProps = {
  filteredCandidates: readonly AccompanimentPortionCandidate[]
  hasCandidates: boolean
  isError: boolean
  isLoading: boolean
  onRetry: () => void
  onToggle: (portionProductId: string, isSelected: boolean) => void
  selectedIdSet: ReadonlySet<string>
}

export const PortionPickerList = ({
  isError,
  isLoading,
  onRetry,
  ...rowsProps
}: PortionPickerListProps) => (
  <div className={SCROLL_AREA_CLASS}>
    {isLoading || isError ? (
      <PortionPickerStatus isError={isError} onRetry={onRetry} />
    ) : (
      <PortionPickerRows {...rowsProps} />
    )}
  </div>
)
