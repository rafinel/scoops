import { act, renderHook } from '@testing-library/react'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { useProductsQuery } from '@/ui/mrp/hooks/use-products-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useProductsPage } from '../use-products-page'

vi.mock('@/ui/mrp/hooks/use-products-query', () => ({ useProductsQuery: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
const useProductsQueryMock = vi.mocked(useProductsQuery)
const useAuthContextMock = vi.mocked(useAuthContext)
const search = {
  search: 'polpa',
  categories: [],
  sortBy: 'name' as const,
  sortDirection: 'asc' as const,
  page: 2,
}

describe('useProductsPage', () => {
  it('derives access and clears all filters from the empty state', () => {
    const onSearchChange = vi.fn()
    const refetchProducts = vi.fn()
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useProductsQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      isPending: false,
      refetch: refetchProducts,
    } as never)
    const { result } = renderHook(() => useProductsPage({ onSearchChange, search }))

    expect(result.current.canManageTypes).toBe(true)
    expect(result.current.hasFilters).toBe(true)
    expect(result.current.hasProductsError).toBe(true)
    act(() => result.current.handleEmptyStateClear())
    expect(onSearchChange).toHaveBeenCalledWith({
      ...search,
      search: '',
      categories: [],
      status: undefined,
      stockSituation: undefined,
      page: 1,
    })
    act(() => result.current.handleOpenFilter())
    expect(result.current.isFilterOpen).toBe(true)
    expect(result.current.canManageProducts).toBe(true)
    expect(refetchProducts).not.toHaveBeenCalled()
  })

  it('identifies operators as unable to manage types', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    useProductsQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      isPending: true,
      refetch: vi.fn(),
    } as never)
    const { result } = renderHook(() =>
      useProductsPage({ onSearchChange: vi.fn(), search: { ...search, search: '' } }),
    )
    expect(result.current.canManageTypes).toBe(false)
    expect(result.current.isLoadingProducts).toBe(true)
    expect(result.current.isPendingProducts).toBe(true)
  })

  it('treats the accompaniment relationship filter as active and clears it', () => {
    const onSearchChange = vi.fn()
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useProductsQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const filteredSearch = {
      ...search,
      search: '',
      usedAsAccompanimentId: 'accompaniment-1',
    }
    const { result } = renderHook(() =>
      useProductsPage({ onSearchChange, search: filteredSearch }),
    )

    expect(result.current.hasFilters).toBe(true)
    act(() => result.current.handleEmptyStateClear())

    expect(onSearchChange).toHaveBeenCalledWith({
      ...filteredSearch,
      search: '',
      categories: [],
      usedAsAccompanimentId: undefined,
      status: undefined,
      stockSituation: undefined,
      page: 1,
    })
  })
})
