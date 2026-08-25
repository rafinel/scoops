import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useChangeProductCategoriesAction } from '@/ui/mrp/hooks/use-change-product-categories-action'
import { useProductCategoryRemovalImpactQuery } from '@/ui/mrp/hooks/use-product-category-removal-impact-query'

import { useProductCategoriesCard } from '../use-product-categories-card'

vi.mock('@/ui/mrp/hooks/use-change-product-categories-action', () => ({
  useChangeProductCategoriesAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-category-removal-impact-query', () => ({
  useProductCategoryRemovalImpactQuery: vi.fn(),
}))

const useChangeProductCategoriesActionMock = vi.mocked(useChangeProductCategoriesAction)
const useProductCategoryRemovalImpactQueryMock = vi.mocked(
  useProductCategoryRemovalImpactQuery,
)

describe('useProductCategoriesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChangeProductCategoriesActionMock.mockReturnValue({
      isChangingProductCategories: false,
      changeProductCategories: vi.fn().mockResolvedValue(undefined),
    } as never)
    useProductCategoryRemovalImpactQueryMock.mockReturnValue({
      categoryRemovalImpact: undefined,
      categoryRemovalImpactError: null,
      isLoadingCategoryRemovalImpact: false,
      isPendingCategoryRemovalImpact: false,
      retryCategoryRemovalImpact: vi.fn(),
    } as never)
  })

  it('adds a non-conflicting category and clears the request after success', async () => {
    const changeProductCategories = vi.fn().mockResolvedValue(undefined)
    useChangeProductCategoriesActionMock.mockReturnValue({
      isChangingProductCategories: false,
      changeProductCategories,
    } as never)
    const product = ProductFaker.fake({ categories: ['ingredient'] })
    const { result } = renderHook(() => useProductCategoriesCard(product, {}))

    act(() => result.current.handleCategoryClick('manufacturable'))
    await waitFor(() => expect(changeProductCategories).toHaveBeenCalledOnce())

    expect(changeProductCategories).toHaveBeenCalledWith({
      categories: ['ingredient', 'manufacturable'],
      expectedUpdatedAt: product.updatedAt,
    })
    expect(result.current.error).toBeUndefined()
  })

  it('blocks mutually exclusive categories and retries the last failed request', async () => {
    const changeProductCategories = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha ao salvar'))
      .mockResolvedValueOnce(undefined)
    useChangeProductCategoriesActionMock.mockReturnValue({
      isChangingProductCategories: false,
      changeProductCategories,
    } as never)
    const product = ProductFaker.fake({ categories: ['portion'] })
    const { result } = renderHook(() => useProductCategoriesCard(product, {}))

    act(() => result.current.handleCategoryClick('resale'))
    expect(result.current.error).toBe(
      'Porção e Revenda não podem ser usadas juntas neste produto.',
    )
    expect(changeProductCategories).not.toHaveBeenCalled()

    act(() => result.current.handleCategoryClick('ingredient'))
    await waitFor(() => expect(result.current.error).toBe('Falha ao salvar'))
    act(() => result.current.handleRetry())
    await waitFor(() => expect(changeProductCategories).toHaveBeenCalledTimes(2))
    expect(result.current.error).toBeUndefined()
  })
})
