import type { KeyboardEvent } from 'react'

import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { PortionPickerList } from '../portion-picker-list'
import { PortionPickerSearch } from '../portion-picker-search'

export type PortionPickerBoxProps = {
  filteredCandidates: readonly AccompanimentPortionCandidate[]
  hasCandidates: boolean
  isError: boolean
  isLoading: boolean
  isSearchDimmed: boolean
  isSearchDisabled: boolean
  labelId: string
  limitMessage?: string
  onRetry: () => void
  handleSearchChange: (search: string) => void
  handleSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleToggle: (portionProductId: string, isSelected: boolean) => void
  search: string
  selectedIdSet: ReadonlySet<string>
  selectionLabel: string
}

export const PortionPickerBox = (props: PortionPickerBoxProps) => (
  <fieldset
    aria-labelledby={props.labelId}
    className='m-0 min-w-0 overflow-hidden rounded-[10px] border border-border p-0'
  >
    <PortionPickerSearch
      isDimmed={props.isSearchDimmed}
      isDisabled={props.isSearchDisabled}
      onChange={props.handleSearchChange}
      onKeyDown={props.handleSearchKeyDown}
      value={props.search}
    />
    <PortionPickerList
      filteredCandidates={props.filteredCandidates}
      hasCandidates={props.hasCandidates}
      isError={props.isError}
      isLoading={props.isLoading}
      onRetry={props.onRetry}
      onToggle={props.handleToggle}
      selectedIdSet={props.selectedIdSet}
    />
    <div className='grid gap-0.5 bg-muted px-3.5 py-2.5 text-xs font-semibold text-muted-foreground'>
      <span aria-live='polite'>{props.selectionLabel}</span>
      {props.limitMessage ? (
        <span className='font-medium' role='status'>
          {props.limitMessage}
        </span>
      ) : null}
    </div>
  </fieldset>
)
