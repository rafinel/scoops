import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSalesAnalyticsQuery } from '@/ui/analytics/hooks/use-sales-analytics-query'
import { useStockAttentionQuery } from '@/ui/analytics/hooks/use-stock-attention-query'

import { useDashboardPage } from '../use-dashboard-page'

vi.mock('@/ui/analytics/hooks/use-sales-analytics-query', () => ({
  useSalesAnalyticsQuery: vi.fn(() => ({ refetch: vi.fn() })),
}))
vi.mock('@/ui/analytics/hooks/use-stock-attention-query', () => ({
  useStockAttentionQuery: vi.fn(() => ({ refetch: vi.fn() })),
}))

const salesRefetch = vi.fn().mockResolvedValue(undefined)
const stockRefetch = vi.fn().mockResolvedValue(undefined)

describe('useDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSalesAnalyticsQuery).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      refetch: salesRefetch,
    })
    vi.mocked(useStockAttentionQuery).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isRefreshing: false,
      isStale: false,
      refetch: stockRefetch,
    })
  })

  it('keeps the dashboard default period at thirty local days', async () => {
    const { result } = renderHook(() => useDashboardPage())
    expect(result.current.period).toBe('last-30-days')

    act(() => result.current.setPeriod('today'))
    expect(result.current.period).toBe('today')
    expect(useSalesAnalyticsQuery).toHaveBeenLastCalledWith('today')
  })

  it('refreshes sales and stock together', async () => {
    const { result } = renderHook(() => useDashboardPage())
    await act(async () => {
      await result.current.refresh()
    })
    expect(salesRefetch).toHaveBeenCalledOnce()
    expect(stockRefetch).toHaveBeenCalledOnce()
  })
})
