import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductAccompanimentsDetails } from '@scoops/core/mrp/domain/structures'

import { useProductAccompanimentsQuery } from '@/ui/mrp/hooks/use-product-accompaniments-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useProductAccompanimentsSlot } from '../use-product-accompaniments-slot'

vi.mock('@/ui/mrp/hooks/use-product-accompaniments-query', () => ({
  useProductAccompanimentsQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useProductAccompanimentsQueryMock = vi.mocked(useProductAccompanimentsQuery)
const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useNavigationMock = vi.mocked(useNavigation)
const product = ProductFaker.fake({ categories: ['portion'] })
const details: ProductAccompanimentsDetails = { product, accompaniments: [] }

describe('useProductAccompanimentsSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('owns action selection, navigation, retry and refresh transitions', () => {
    const refetchAccompaniments = vi.fn()
    const refetchStock = vi.fn()
    const navigateTo = vi.fn()
    useProductAccompanimentsQueryMock.mockReturnValue({
      data: details,
      isError: false,
      isPending: false,
      refetch: refetchAccompaniments,
    } as never)
    useProductStockQueryMock.mockReturnValue({
      data: { product },
      isError: false,
      isPending: false,
      refetch: refetchStock,
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo } as never)

    const { result } = renderHook(() => useProductAccompanimentsSlot('product-1'))

    act(() => result.current.handleAddAction())
    expect(result.current.selectedAction).toEqual({ kind: 'add' })
    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
    act(() => result.current.handleBack())
    expect(navigateTo).toHaveBeenCalledWith('products')

    act(() => result.current.handleRetry())
    act(() => result.current.handleActionSuccess())
    expect(refetchStock).toHaveBeenCalledTimes(1)
    expect(refetchAccompaniments).toHaveBeenCalledTimes(2)
    expect(result.current.selectedAction).toBeUndefined()
  })

  it('combines loading and error state from stock and accompaniment queries', () => {
    useProductAccompanimentsQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    useProductStockQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      refetch: vi.fn(),
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn() } as never)

    const { result } = renderHook(() => useProductAccompanimentsSlot('product-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(true)
  })
})
