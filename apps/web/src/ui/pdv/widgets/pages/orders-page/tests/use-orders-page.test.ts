import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useOrdersQuery } from '@/ui/pdv/hooks/use-orders-query'
import { useSalesChannelsQuery } from '@/ui/pdv/hooks/use-sales-channels-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useOrdersPage } from '../use-orders-page'

vi.mock('@/ui/pdv/hooks/use-orders-query', () => ({ useOrdersQuery: vi.fn() }))
vi.mock('@/ui/pdv/hooks/use-sales-channels-query', () => ({
  useSalesChannelsQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useOrdersQueryMock = vi.mocked(useOrdersQuery)
const useSalesChannelsQueryMock = vi.mocked(useSalesChannelsQuery)
const useNavigationMock = vi.mocked(useNavigation)

const search = {
  search: '',
  channelId: undefined,
  status: undefined,
  period: 'last-30-days' as const,
  page: 1,
}

describe('useOrdersPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useOrdersQueryMock.mockReturnValue({
      isLoadingOrders: false,
      ordersError: null,
      ordersPage: undefined,
      refetchOrders: vi.fn(),
    })
    useSalesChannelsQueryMock.mockReturnValue({
      isLoadingSalesChannels: false,
      isSalesChannelsError: false,
      refetchSalesChannels: vi.fn(),
      salesChannels: [],
      salesChannelsError: null,
    })
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateToPath: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => vi.useRealTimers())

  it('keeps the list query disabled before client readiness and resolves a bounded local period after it', () => {
    const { result } = renderHook(() =>
      useOrdersPage({ onSearchChange: vi.fn(), search }),
    )

    expect(useOrdersQueryMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ isPeriodReady: false }),
    )

    act(() => vi.runOnlyPendingTimers())
    expect(useOrdersQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        createdFrom: expect.any(Date),
        createdTo: expect.any(Date),
        isPeriodReady: true,
      }),
    )
    expect(result.current.hasFilters).toBe(false)
  })

  it('resets filters to the default period and routes an order to its canonical detail path', () => {
    const onSearchChange = vi.fn()
    const { result } = renderHook(() => useOrdersPage({ onSearchChange, search }))
    act(() => result.current.handleClearFilters())
    expect(onSearchChange).toHaveBeenCalledWith({
      channelId: undefined,
      search: '',
      period: 'last-30-days',
      status: undefined,
      page: 1,
    })

    act(() => result.current.handleOpenOrder('order-1'))
    expect(useNavigationMock().navigateToPath).toHaveBeenCalledWith('/orders/order-1')
  })
})
