import { act, renderHook } from '@testing-library/react'
import {
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { useProductsListCard } from '../use-products-list-card'

const search = {
  search: '',
  categories: [],
  sortBy: ProductSortField.Name,
  sortDirection: ProductSortDirection.Ascending,
  page: 2,
}

describe('useProductsListCard', () => {
  it('resets pagination for search and sort while preserving page changes', () => {
    const onSearchChange = vi.fn()
    const { result } = renderHook(() => useProductsListCard({ onSearchChange, search }))

    act(() => result.current.handleSearch('polpa'))
    expect(onSearchChange).toHaveBeenCalledWith({ ...search, search: 'polpa', page: 1 })
    act(() => result.current.handleSort(ProductSortField.Name))
    expect(onSearchChange).toHaveBeenCalledWith({
      ...search,
      page: 1,
      sortBy: ProductSortField.Name,
      sortDirection: ProductSortDirection.Descending,
    })
    act(() => result.current.handlePageChange(3))
    expect(onSearchChange).toHaveBeenCalledWith({ ...search, page: 3 })
    expect(result.current.filterCount).toBe(0)
  })
})
