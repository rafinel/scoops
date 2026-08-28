import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useOrderCatalogQuery } from '@/ui/pdv/hooks/use-order-catalog-query'

import { useNewSaleCatalog } from '../use-new-sale-catalog'

vi.mock('@/ui/pdv/hooks/use-order-catalog-query', () => ({
  useOrderCatalogQuery: vi.fn(),
}))

const useOrderCatalogQueryMock = vi.mocked(useOrderCatalogQuery)

describe('useNewSaleCatalog', () => {
  it('resets pagination when filters change and ignores unavailable products', () => {
    const onSelectProduct = vi.fn()
    useOrderCatalogQueryMock.mockReturnValue({
      catalogError: undefined,
      catalogPage: undefined,
      isCatalogError: false,
      isLoadingCatalog: false,
      refetchCatalog: vi.fn(),
    } as never)
    const { result } = renderHook(() => useNewSaleCatalog({ onSelectProduct }))

    act(() => result.current.handlePageChange(3))
    act(() => result.current.handleSearchChange('baunilha'))
    act(() => result.current.handleKindChange('resale'))

    expect(result.current.page).toBe(1)
    expect(result.current.search).toBe('baunilha')
    expect(result.current.kind).toBe('resale')

    act(() => result.current.handleSelectProduct({ isAvailable: false } as never))
    expect(onSelectProduct).not.toHaveBeenCalled()
  })
})
