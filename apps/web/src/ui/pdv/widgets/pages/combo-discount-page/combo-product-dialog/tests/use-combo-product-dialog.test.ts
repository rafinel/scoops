import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useComboProductsQuery } from '@/ui/pdv/hooks/use-combo-products-query'

import { useComboProductDialog } from '../use-combo-product-dialog'

import { portionProduct, resaleProduct } from '../../tests/combo-test-fixtures'

vi.mock('@/ui/pdv/hooks/use-combo-products-query', () => ({
  useComboProductsQuery: vi.fn(),
}))

const useComboProductsQueryMock = vi.mocked(useComboProductsQuery)

describe('useComboProductDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useComboProductsQueryMock.mockReturnValue({
      catalogError: null,
      catalogPage: {
        items: [
          portionProduct,
          resaleProduct,
          { ...resaleProduct, productId: 'inactive', isActive: false },
        ],
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
      },
      isCatalogError: false,
      isLoadingCatalog: false,
    } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('filters inactive and existing products and debounces the catalog search', () => {
    const { result, rerender } = renderHook(
      ({ open }) =>
        useComboProductDialog({
          existingProductIds: ['resale-2'],
          onAdd: vi.fn(),
          onOpenChange: vi.fn(),
          open,
        }),
      { initialProps: { open: true } },
    )

    expect(result.current.products.map(({ productId }) => productId)).toEqual([
      'portion-2',
    ])
    act(() => result.current.handleSearchChange('  acai '))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith('', undefined, true)
    act(() => vi.advanceTimersByTime(250))
    rerender({ open: true })
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith('acai', undefined, true)
  })

  it('builds a portion component with active accompaniments and protects invalid additions', () => {
    const product = {
      ...portionProduct,
      sizes: [
        {
          ...portionProduct.sizes[0],
          accompaniments: [
            {
              accompanimentId: 'active-accompaniment',
              basePrice: 1.235,
              isActive: true,
              isAvailable: true,
              name: 'Granola',
              quantityPerPortion: 1,
              type: 'extra',
            },
            {
              accompanimentId: 'inactive-accompaniment',
              basePrice: 99,
              isActive: false,
              isAvailable: true,
              name: 'Inactive',
              quantityPerPortion: 1,
              type: 'extra',
            },
          ],
        },
      ],
    }
    useComboProductsQueryMock.mockReturnValue({
      catalogError: null,
      catalogPage: { items: [product], page: 1, pageSize: 20, total: 1, totalPages: 1 },
      isCatalogError: false,
      isLoadingCatalog: false,
    } as never)
    const onAdd = vi.fn()
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd,
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    act(() => result.current.handleSelectProduct(product))
    act(() => result.current.toggleAccompaniment('active-accompaniment'))
    act(() => result.current.handleIncreaseQuantity())
    act(() => result.current.handleDecreaseQuantity())
    act(() => result.current.handleAdd())

    expect(result.current.subtotal).toBe(15.24)
    expect(onAdd).toHaveBeenCalledWith({
      accompanimentNames: ['Granola'],
      component: {
        accompanimentIds: ['active-accompaniment'],
        kind: 'portion',
        productId: 'portion-2',
        quantity: 1,
        sizeId: 'size-2',
      },
      configurationName: '500 ml',
      productName: 'Açaí',
      subtotal: 15.24,
      unitPrice: 15.24,
      validity: 'valid',
    })

    act(() => result.current.handleSelectSize('missing-size'))
    act(() => result.current.handleAdd())
    expect(result.current.configurationError).toContain('configuração válida')
  })

  it('selects a resale brand, calculates quantity, and resets state when closed and reopened', () => {
    const product = {
      ...resaleProduct,
      resalePrice: undefined,
      resaleBrands: [
        {
          brandId: 'brand-1',
          name: 'Nutella',
          basePrice: 7.5,
          isActive: true,
          isAvailable: true,
        },
        {
          brandId: 'brand-inactive',
          name: 'Inactive',
          basePrice: 2,
          isActive: false,
          isAvailable: true,
        },
      ],
    }
    useComboProductsQueryMock.mockReturnValue({
      catalogError: null,
      catalogPage: { items: [product], page: 1, pageSize: 20, total: 1, totalPages: 1 },
      isCatalogError: false,
      isLoadingCatalog: false,
    } as never)
    const onOpenChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ open }) =>
        useComboProductDialog({
          existingProductIds: [],
          onAdd: vi.fn(),
          onOpenChange,
          open,
        }),
      { initialProps: { open: true } },
    )

    act(() => result.current.handleSelectProduct(product))
    act(() => result.current.handleSelectBrand('brand-1'))
    act(() => result.current.handleIncreaseQuantity())
    expect(result.current.subtotal).toBe(15)
    expect(result.current.isValidConfiguration).toBe(true)

    rerender({ open: false })
    rerender({ open: true })
    expect(result.current.selectedProduct).toBeUndefined()
    expect(result.current.quantity).toBe(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
