import { act, renderHook } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { useProductFiltersDialog } from '../use-product-filters-dialog'

const search = {
  search: '',
  categories: [] as ProductCategory[],
  sortBy: 'name' as const,
  sortDirection: 'asc' as const,
  page: 2,
}
const filteredSearch = { ...search, categories: [ProductCategory.Portion] }

describe('useProductFiltersDialog', () => {
  it('drafts filters and applies them from the first page', () => {
    const onOpenChange = vi.fn()
    const onSearchChange = vi.fn()
    const { result } = renderHook(() =>
      useProductFiltersDialog({ isOpen: true, onOpenChange, onSearchChange, search }),
    )

    act(() => result.current.handleCategoryToggle(ProductCategory.Portion))
    act(() => result.current.handleStockSituationToggle('low'))
    act(() => result.current.handleStatusToggle('active'))
    expect(result.current.filterGroupCount).toBe(3)

    act(() => result.current.handleApply())
    expect(onSearchChange).toHaveBeenCalledWith({
      ...search,
      categories: [ProductCategory.Portion],
      stockSituation: 'low',
      status: 'active',
      page: 1,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('clears a selected toggle when clicked again', () => {
    const { result } = renderHook(() =>
      useProductFiltersDialog({
        isOpen: true,
        onOpenChange: vi.fn(),
        onSearchChange: vi.fn(),
        search: filteredSearch,
      }),
    )

    act(() => result.current.handleCategoryToggle(ProductCategory.Portion))
    act(() => result.current.handleStockSituationToggle('normal'))
    act(() => result.current.handleStockSituationToggle('normal'))
    expect(result.current.draftCategories).toEqual([])
    expect(result.current.draftStockSituation).toBeUndefined()
  })
})
