import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import {
  LIMIT_MESSAGE,
  MAX_PORTIONS_PER_LINK,
  usePortionPicker,
} from '../use-portion-picker'

const candidates: AccompanimentPortionCandidate[] = [
  { productId: 'a', name: 'Açaí 300 ml', status: 'active' },
  { productId: 'b', name: 'Barca grande', status: 'active' },
  { productId: 'c', name: 'Sorvete de coco', status: 'inactive' },
  { productId: 'd', name: 'Sorvete de pistache', status: 'active' },
]

function renderPicker(selectedIds: string[] = [], list = candidates) {
  const onSelectedIdsChange = vi.fn()
  const hook = renderHook(() =>
    usePortionPicker({ candidates: list, onSelectedIdsChange, selectedIds }),
  )
  return { ...hook, onSelectedIdsChange }
}

describe('usePortionPicker', () => {
  it('starts with every candidate, no search and a zero count label', () => {
    const { result } = renderPicker()

    expect(result.current.filteredCandidates).toEqual(candidates)
    expect(result.current.hasCandidates).toBe(true)
    expect(result.current.search).toBe('')
    expect(result.current.selectionLabel).toBe('0 selecionadas')
    expect(result.current.areAllFilteredSelected).toBe(false)
    expect(result.current.labelId).not.toBe('')
  })

  it.each([
    [0, '0 selecionadas'],
    [1, '1 selecionada'],
    [2, '2 selecionadas'],
  ])('labels %s selected Portions as "%s"', (count, label) => {
    const { result } = renderPicker(candidates.slice(0, count).map((c) => c.productId))

    expect(result.current.selectedCount).toBe(count)
    expect(result.current.selectionLabel).toBe(label)
  })

  it('filters by a case- and accent-insensitive partial name', () => {
    const { result } = renderPicker()

    act(() => result.current.handleSearchChange('ACAI'))
    expect(result.current.filteredCandidates.map((c) => c.productId)).toEqual(['a'])
    act(() => result.current.handleSearchChange('  sorvete '))
    expect(result.current.filteredCandidates.map((c) => c.productId)).toEqual(['c', 'd'])
    act(() => result.current.handleSearchChange('zzz'))
    expect(result.current.filteredCandidates).toEqual([])
    expect(result.current.hasCandidates).toBe(true)
  })

  it('reports no candidates when the list is empty', () => {
    const { result } = renderPicker([], [])

    expect(result.current.hasCandidates).toBe(false)
    expect(result.current.filteredCandidates).toEqual([])
  })

  it('adds and removes a single Portion keeping the others', () => {
    const { result, onSelectedIdsChange } = renderPicker(['a'])

    result.current.handleToggle('b', true)
    result.current.handleToggle('a', false)

    expect(onSelectedIdsChange).toHaveBeenNthCalledWith(1, ['a', 'b'])
    expect(onSelectedIdsChange).toHaveBeenNthCalledWith(2, [])
  })

  it('selects every filtered Portion while keeping hidden selections', () => {
    const { result, onSelectedIdsChange } = renderPicker(['a'])

    act(() => result.current.handleSearchChange('sorvete'))
    act(() => result.current.handleToggleAll())

    expect(onSelectedIdsChange).toHaveBeenCalledWith(['a', 'c', 'd'])
  })

  it('does not duplicate Portions that are already selected when selecting all', () => {
    const { result, onSelectedIdsChange } = renderPicker(['c'])

    act(() => result.current.handleSearchChange('sorvete'))
    act(() => result.current.handleToggleAll())

    expect(onSelectedIdsChange).toHaveBeenCalledWith(['c', 'd'])
  })

  it('clears only the filtered Portions when every one of them is selected', () => {
    const { result, onSelectedIdsChange } = renderPicker(['a', 'c', 'd'])

    act(() => result.current.handleSearchChange('sorvete'))
    expect(result.current.areAllFilteredSelected).toBe(true)
    act(() => result.current.handleToggleAll())

    expect(onSelectedIdsChange).toHaveBeenCalledWith(['a'])
  })

  it('is not all selected when the filter matches nothing', () => {
    const { result } = renderPicker(['a'])

    act(() => result.current.handleSearchChange('zzz'))

    expect(result.current.areAllFilteredSelected).toBe(false)
  })

  it('exposes the selected ids as a lookup set', () => {
    const { result } = renderPicker(['b'])

    expect(result.current.selectedIdSet.has('b')).toBe(true)
    expect(result.current.selectedIdSet.has('a')).toBe(false)
  })

  it('prevents Enter in the search input from submitting the form', () => {
    const { result } = renderPicker()
    const enter = { key: 'Enter', preventDefault: vi.fn() } as never
    const other = { key: 'a', preventDefault: vi.fn() } as never

    result.current.handleSearchKeyDown(enter)
    result.current.handleSearchKeyDown(other)

    expect(
      (enter as { preventDefault: () => void }).preventDefault,
    ).toHaveBeenCalledTimes(1)
    expect(
      (other as { preventDefault: () => void }).preventDefault,
    ).not.toHaveBeenCalled()
  })

  it('shows the toggle and enables the search only when idle with candidates', () => {
    const idle = renderHook(() =>
      usePortionPicker({ candidates, onSelectedIdsChange: vi.fn(), selectedIds: [] }),
    ).result.current
    const loading = renderHook(() =>
      usePortionPicker({
        candidates,
        isLoading: true,
        onSelectedIdsChange: vi.fn(),
        selectedIds: [],
      }),
    ).result.current
    const failed = renderHook(() =>
      usePortionPicker({
        candidates: [],
        isError: true,
        onSelectedIdsChange: vi.fn(),
        selectedIds: [],
      }),
    ).result.current
    const empty = renderHook(() =>
      usePortionPicker({ candidates: [], onSelectedIdsChange: vi.fn(), selectedIds: [] }),
    ).result.current

    expect(idle.showsToggleAll).toBe(true)
    expect(idle.isSearchDisabled).toBe(false)
    expect(idle.isSearchDimmed).toBe(false)
    expect(loading.showsToggleAll).toBe(false)
    expect(loading.isSearchDisabled).toBe(true)
    expect(loading.isSearchDimmed).toBe(false)
    expect(failed.isSearchDisabled).toBe(true)
    expect(empty.isSearchDisabled).toBe(true)
    expect(empty.isSearchDimmed).toBe(true)
    expect(empty.showsToggleAll).toBe(false)
  })

  describe('per-link limit', () => {
    const many: AccompanimentPortionCandidate[] = Array.from(
      { length: 520 },
      (_v, index) => ({
        productId: `p-${index}`,
        name: `Porção ${index}`,
        status: 'active' as const,
      }),
    )

    it('caps Selecionar todas at the first 500 filtered rows and announces the limit', () => {
      const { result, onSelectedIdsChange } = renderPicker([], many)

      act(() => result.current.handleToggleAll())

      const ids = onSelectedIdsChange.mock.calls[0]?.[0] as string[]
      expect(MAX_PORTIONS_PER_LINK).toBe(500)
      expect(ids).toHaveLength(500)
      expect(ids[0]).toBe('p-0')
      expect(ids.at(-1)).toBe('p-499')
    })

    it('reports the limit message only when 500 are selected and more remain', () => {
      const full = many.slice(0, 500).map((candidate) => candidate.productId)
      const reached = renderPicker(full, many).result.current
      const exact = renderPicker(full, many.slice(0, 500)).result.current
      const below = renderPicker(full.slice(0, 10), many).result.current

      expect(reached.limitMessage).toBe(LIMIT_MESSAGE)
      expect(exact.limitMessage).toBeUndefined()
      expect(below.limitMessage).toBeUndefined()
    })

    it('ignores toggling a 501st Portion on', () => {
      const full = many.slice(0, 500).map((candidate) => candidate.productId)
      const { result, onSelectedIdsChange } = renderPicker(full, many)

      act(() => result.current.handleToggle('p-510', true))

      expect(onSelectedIdsChange.mock.calls[0]?.[0]).toHaveLength(500)
      expect(onSelectedIdsChange.mock.calls[0]?.[0]).not.toContain('p-510')
    })

    it('fills only the remaining room when some Portions are already selected', () => {
      const { result, onSelectedIdsChange } = renderPicker(['p-519'], many)

      act(() => result.current.handleToggleAll())

      const ids = onSelectedIdsChange.mock.calls[0]?.[0] as string[]
      expect(ids).toHaveLength(500)
      expect(ids[0]).toBe('p-519')
    })
  })
})
