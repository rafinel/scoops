import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'

import { useProductDetailsHeader } from '../use-product-details-header'

vi.mock('@/ui/mrp/hooks/use-global-accompaniment-query', () => ({
  useGlobalAccompanimentQuery: vi.fn(),
}))

const useGlobalAccompanimentQueryMock = vi.mocked(useGlobalAccompanimentQuery)

function mockGlobalQuery(data: { isGlobal: boolean } | undefined) {
  useGlobalAccompanimentQueryMock.mockReturnValue({ data } as never)
}

describe('useProductDetailsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGlobalQuery(undefined)
  })

  it('reads the global state only for products with the Accompaniment category', () => {
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      categories: [ProductCategory.Accompaniment],
    })
    renderHook(() => useProductDetailsHeader({ product: accompaniment }))

    expect(useGlobalAccompanimentQueryMock).toHaveBeenLastCalledWith(
      'accompaniment-1',
      true,
    )
  })

  it.each([
    [[ProductCategory.Ingredient]],
    [[ProductCategory.Portion]],
    [[ProductCategory.Resale, ProductCategory.Manufacturable]],
  ])('does not request the global state for %j', (categories) => {
    const product = ProductFaker.fake({ id: 'product-1', categories })
    renderHook(() => useProductDetailsHeader({ product }))

    expect(useGlobalAccompanimentQueryMock).toHaveBeenLastCalledWith('product-1', false)
  })

  it('exposes the global tag only for a global Accompaniment', () => {
    mockGlobalQuery({ isGlobal: true })
    const product = ProductFaker.fake({ categories: [ProductCategory.Accompaniment] })
    const { result } = renderHook(() => useProductDetailsHeader({ product }))

    expect(result.current.isGlobal).toBe(true)
    expect(result.current.isCategoryGlobal(ProductCategory.Accompaniment)).toBe(true)
    expect(result.current.isCategoryGlobal(ProductCategory.Resale)).toBe(false)
  })

  it('renders no tag for a non-global Accompaniment', () => {
    mockGlobalQuery({ isGlobal: false })
    const product = ProductFaker.fake({ categories: [ProductCategory.Accompaniment] })
    const { result } = renderHook(() => useProductDetailsHeader({ product }))

    expect(result.current.isGlobal).toBe(false)
    expect(result.current.isCategoryGlobal(ProductCategory.Accompaniment)).toBe(false)
  })

  it('renders no tag while the global state is loading or failed', () => {
    mockGlobalQuery(undefined)
    const product = ProductFaker.fake({ categories: [ProductCategory.Accompaniment] })
    const { result } = renderHook(() => useProductDetailsHeader({ product }))

    expect(result.current.isGlobal).toBe(false)
    expect(result.current.isCategoryGlobal(ProductCategory.Accompaniment)).toBe(false)
  })

  it('ignores a stale global state for a product without the Accompaniment category', () => {
    mockGlobalQuery({ isGlobal: true })
    const product = ProductFaker.fake({ categories: [ProductCategory.Portion] })
    const { result } = renderHook(() => useProductDetailsHeader({ product }))

    expect(result.current.isGlobal).toBe(false)
    expect(result.current.isCategoryGlobal(ProductCategory.Accompaniment)).toBe(false)
  })
})
