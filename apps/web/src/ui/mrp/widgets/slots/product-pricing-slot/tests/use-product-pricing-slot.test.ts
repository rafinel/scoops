import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useRemoveProductSizeAction } from '@/ui/mrp/hooks/use-remove-product-size-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useProductPricingSlot } from '../use-product-pricing-slot'

vi.mock('@/ui/mrp/hooks/use-product-pricing-query', () => ({
  useProductPricingQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-remove-product-size-action', () => ({
  useRemoveProductSizeAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useProductPricingQueryMock = vi.mocked(useProductPricingQuery)
const useRemoveProductSizeActionMock = vi.mocked(useRemoveProductSizeAction)
const useNavigationMock = vi.mocked(useNavigation)

describe('useProductPricingSlot', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useProductPricingQueryMock.mockReturnValue({
      pricing: undefined,
      pricingError: false,
      isLoadingPricing: false,
      retryPricing: vi.fn(),
    } as never)
    useRemoveProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductSize: vi.fn(),
    })
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn(),
      navigateToPath: vi.fn(),
    })
  })

  it('remembers the action selection and closes it through the shared boundary', () => {
    const { result } = renderHook(() => useProductPricingSlot('product-1'))
    const target = document.createElement('button')

    act(() => result.current.handleAdd(target))
    expect(result.current.selectedAction).toEqual({ kind: 'add' })

    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
  })
})
