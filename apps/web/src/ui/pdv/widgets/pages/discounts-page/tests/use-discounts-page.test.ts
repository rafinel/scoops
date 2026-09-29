import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { useDiscountsQuery } from '@/ui/pdv/hooks/use-discounts-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { useDiscountsPage } from '../use-discounts-page'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useSearch: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-discounts-query', () => ({
  useDiscountsQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))

const useNavigateMock = vi.mocked(useNavigate)
const useSearchMock = vi.mocked(useSearch)
const useDiscountsQueryMock = vi.mocked(useDiscountsQuery)
const useNavigationMock = vi.mocked(useNavigation)
const useAuthContextMock = vi.mocked(useAuthContext)

describe('useDiscountsPage', () => {
  const navigateMock = vi.fn()
  const refetchDiscountsMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthContextMock.mockReturnValue({ account: { profile: 'manager' } } as never)
    useNavigateMock.mockReturnValue(navigateMock as never)
    useSearchMock.mockReturnValue({ page: 1, pageSize: 10 } as never)
    useDiscountsQueryMock.mockReturnValue({
      discountsError: null,
      discountsPage: undefined,
      isDiscountsError: false,
      isFetchingDiscounts: false,
      isLoadingDiscounts: false,
      isPageLoadingDiscounts: false,
      isRefreshingDiscounts: false,
      refetchDiscounts: refetchDiscountsMock,
    })
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateToPath: vi.fn(),
    })
  })

  it('exposes refresh state and preserves retry and filter navigation behavior', () => {
    const { result } = renderHook(() => useDiscountsPage())

    expect(result.current.isRefreshingDiscounts).toBe(false)

    act(() => result.current.handleRetry())
    expect(refetchDiscountsMock).toHaveBeenCalledOnce()

    act(() => result.current.handleClearFilters())
    expect(navigateMock).toHaveBeenCalledWith({
      search: {
        page: undefined,
        pageSize: undefined,
        search: undefined,
        status: undefined,
        type: undefined,
      },
    })
  })

  it('allows only Managers to manage discounts', () => {
    useAuthContextMock.mockReturnValue({ account: { profile: 'operator' } } as never)
    const { result } = renderHook(() => useDiscountsPage())
    expect(result.current.canManageDiscounts).toBe(false)
  })
})
