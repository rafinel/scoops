import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useProductDetailsPlaceholderSlot } from '../use-product-details-placeholder-slot'

vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useNavigationMock = vi.mocked(useNavigation)
const supportedProduct = ProductFaker.fake({ categories: ['portion'] })
const allowedCategories = ['portion'] as const

describe('useProductDetailsPlaceholderSlot', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('owns navigation, retry and supported-category state', () => {
    const refetch = vi.fn()
    const navigateTo = vi.fn()
    const navigateToPath = vi.fn()
    useProductStockQueryMock.mockReturnValue({
      data: { product: supportedProduct },
      isError: false,
      isPending: false,
      refetch,
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo, navigateToPath } as never)

    const { result } = renderHook(() =>
      useProductDetailsPlaceholderSlot('product-1', allowedCategories),
    )

    expect(result.current.product).toBe(supportedProduct)
    expect(result.current.isUnsupported).toBe(false)
    act(() => result.current.handleBack())
    act(() => result.current.handleRetry())

    expect(navigateTo).toHaveBeenCalledWith('products')
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(navigateToPath).not.toHaveBeenCalled()
  })

  it('redirects unsupported products to stock and preserves query status', () => {
    const navigateToPath = vi.fn()
    useProductStockQueryMock.mockReturnValue({
      data: {
        product: ProductFaker.fake({ categories: ['resale'] }),
      },
      isError: true,
      isPending: true,
      refetch: vi.fn(),
    } as never)
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn(),
      navigateToPath,
    } as never)

    const { result } = renderHook(() =>
      useProductDetailsPlaceholderSlot('product-1', allowedCategories),
    )

    expect(result.current.isUnsupported).toBe(true)
    expect(result.current.hasProductError).toBe(true)
    expect(result.current.isLoadingProduct).toBe(true)
    expect(navigateToPath).toHaveBeenCalledWith('/products/product-1/stock')
  })
})
