import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useOrdersFilters } from '../use-orders-filters'

const search = {
  search: '',
  channelId: undefined,
  status: undefined,
  period: 'last-30-days' as const,
  page: 2,
}

describe('useOrdersFilters', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('debounces search changes and resets pagination', () => {
    const onSearchChange = vi.fn()
    const { result } = renderHook(() =>
      useOrdersFilters({
        channels: [],
        isLoadingChannels: false,
        onClear: vi.fn(),
        onSearchChange,
        search,
      }),
    )

    act(() => result.current.setSearchValue('  #00124 '))
    act(() => vi.advanceTimersByTime(299))
    expect(onSearchChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onSearchChange).toHaveBeenCalledWith({
      ...search,
      search: '  #00124 ',
      page: 1,
    })
  })

  it('normalizes channel and status selections while retaining canonical values', () => {
    const onSearchChange = vi.fn()
    const { result } = renderHook(() =>
      useOrdersFilters({
        channels: [],
        isLoadingChannels: false,
        onClear: vi.fn(),
        onSearchChange,
        search,
      }),
    )

    act(() => result.current.handleChannelChange('none'))
    act(() => result.current.handleStatusChange('canceled'))
    expect(onSearchChange).toHaveBeenNthCalledWith(1, {
      ...search,
      channelId: 'none',
      page: 1,
    })
    expect(onSearchChange).toHaveBeenNthCalledWith(2, {
      ...search,
      status: 'canceled',
      page: 1,
    })
  })
})
