import { useId } from 'react'

import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { usePortionSearch } from './use-portion-search'

export const MAX_PORTIONS_PER_LINK = 500
export const LIMIT_MESSAGE =
  'Limite de 500 porções por vínculo; as demais podem ser vinculadas em seguida.'

export type UsePortionPickerProps = {
  candidates: readonly AccompanimentPortionCandidate[]
  isError?: boolean
  isLoading?: boolean
  onSelectedIdsChange: (portionProductIds: string[]) => void
  selectedIds: readonly string[]
}

export function usePortionPicker(props: UsePortionPickerProps) {
  const { candidates, onSelectedIdsChange, selectedIds } = props
  const { search, ...searchState } = usePortionSearch()
  const state = getPickerState(props, search)

  function handleToggle(portionProductId: string, isSelected: boolean) {
    const remainingIds = selectedIds.filter((id) => id !== portionProductId)
    onSelectedIdsChange(
      isSelected ? limitIds([...remainingIds, portionProductId]) : remainingIds,
    )
  }

  function handleToggleAll() {
    const filteredIds = state.filteredCandidates.map((candidate) => candidate.productId)
    onSelectedIdsChange(
      state.areAllFilteredSelected
        ? selectedIds.filter((id) => !filteredIds.includes(id))
        : limitIds([
            ...selectedIds,
            ...filteredIds.filter((id) => !state.selectedIdSet.has(id)),
          ]),
    )
  }

  return {
    ...searchState,
    ...state,
    hasCandidates: candidates.length > 0,
    limitMessage: state.isLimitReached ? LIMIT_MESSAGE : undefined,
    labelId: useId(),
    search,
    handleToggle,
    handleToggleAll,
  }
}

function getPickerState(
  { candidates, isError = false, isLoading = false, selectedIds }: UsePortionPickerProps,
  search: string,
) {
  const filteredCandidates = filterCandidates(candidates, search)
  const selectedIdSet = new Set(selectedIds)
  const isIdle = !isLoading && !isError

  return {
    areAllFilteredSelected: areAllSelected(filteredCandidates, selectedIdSet),
    filteredCandidates,
    isLimitReached:
      selectedIds.length >= MAX_PORTIONS_PER_LINK &&
      candidates.some((candidate) => !selectedIdSet.has(candidate.productId)),
    isSearchDimmed: isIdle && candidates.length === 0,
    isSearchDisabled: !isIdle || candidates.length === 0,
    selectedCount: selectedIds.length,
    selectedIdSet,
    selectionLabel: getSelectionLabel(selectedIds.length),
    showsToggleAll: isIdle && filteredCandidates.length > 0,
  }
}

function limitIds(ids: string[]) {
  return ids.slice(0, MAX_PORTIONS_PER_LINK)
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

function filterCandidates(
  candidates: readonly AccompanimentPortionCandidate[],
  search: string,
) {
  const normalizedSearch = normalizeText(search.trim())
  return candidates.filter((candidate) =>
    normalizeText(candidate.name).includes(normalizedSearch),
  )
}

function areAllSelected(
  filteredCandidates: readonly AccompanimentPortionCandidate[],
  selectedIdSet: ReadonlySet<string>,
) {
  return (
    filteredCandidates.length > 0 &&
    filteredCandidates.every((candidate) => selectedIdSet.has(candidate.productId))
  )
}

function getSelectionLabel(count: number) {
  return `${count} ${count === 1 ? 'selecionada' : 'selecionadas'}`
}
