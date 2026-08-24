import { renderHook, act, waitFor } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { useProductRecipeQuery } from '@/ui/mrp/hooks/use-product-recipe-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useProductRecipeSlot } from '../use-product-recipe-slot'

vi.mock('@/ui/mrp/hooks/use-product-recipe-query', () => ({
  useProductRecipeQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const mockedRecipe = vi.mocked(useProductRecipeQuery)
const mockedStock = vi.mocked(useProductStockQuery)
const mockedNavigation = vi.mocked(useNavigation)
const product = ProductFaker.fake({ id: 'product-1', categories: ['manufacturable'] })
const details = { product, recipe: null }

describe('useProductRecipeSlot', () => {
  it('coordinates loading, retry, actions and back navigation', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn()
    const navigateToPath = vi.fn()
    mockedNavigation.mockReturnValue({ navigateTo, navigateToPath } as never)
    mockedStock.mockReturnValue({ data: { product }, isPending: false } as never)
    mockedRecipe.mockReturnValue({
      data: details,
      isError: false,
      isPending: false,
      refetch,
    } as never)
    const { result } = renderHook(() => useProductRecipeSlot('product-1'))

    act(() => result.current.setSelectedAction({ kind: 'add' }))
    expect(result.current.selectedAction).toEqual({ kind: 'add' })
    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
    act(() => result.current.handleBack())
    act(() => result.current.handleRetry())
    expect(navigateTo).toHaveBeenCalledWith('products')
    expect(refetch).toHaveBeenCalledTimes(1)

    act(() => result.current.handleActionSuccess())
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(2))
    expect(navigateToPath).not.toHaveBeenCalled()
  })

  it('redirects products without the manufacturable category to stock', async () => {
    const navigateToPath = vi.fn()
    mockedNavigation.mockReturnValue({ navigateTo: vi.fn(), navigateToPath } as never)
    mockedStock.mockReturnValue({
      data: { product: ProductFaker.fake({ id: 'product-1', categories: [] }) },
      isPending: false,
    } as never)
    mockedRecipe.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      refetch: vi.fn(),
    } as never)
    const { result } = renderHook(() => useProductRecipeSlot('product-1'))

    expect(result.current.isUnsupported).toBe(true)
    await waitFor(() =>
      expect(navigateToPath).toHaveBeenCalledWith('/products/product-1/stock'),
    )
  })
})
