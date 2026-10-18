import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useComboProductsQuery } from '@/ui/pdv/hooks/use-combo-products-query'

import { useComboProductDialog } from '../use-combo-product-dialog'

import {
  missingPriceProduct,
  outOfStockProduct,
  portionProduct,
  resaleProduct,
} from '../../tests/combo-test-fixtures'

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
      isRefreshingCatalog: false,
    } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('filters inactive and existing products and maps available rows', () => {
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: ['resale-2'],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    expect(result.current.productRows).toEqual([
      {
        availabilityPillId: 'combo-product-availability-portion-2',
        product: portionProduct,
        unavailableReason: undefined,
      },
    ])
  })

  it('requests the trimmed search only after 250 ms and clears it immediately', () => {
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    act(() => result.current.handleSearchChange('  aca'))
    act(() => result.current.handleSearchChange('  acai '))
    expect(result.current.search).toBe('  acai ')
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, undefined, true)
    act(() => vi.advanceTimersByTime(249))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, undefined, true)
    act(() => vi.advanceTimersByTime(1))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith('acai', undefined, true)

    act(() => result.current.handleSearchChange('   '))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, undefined, true)
    act(() => vi.advanceTimersByTime(250))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, undefined, true)
  })

  it('does not bring back an older search when typing again right after clearing', () => {
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    act(() => result.current.handleSearchChange('abc'))
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.handleSearchChange(''))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.handleSearchChange('x'))

    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, undefined, true)
    act(() => vi.advanceTimersByTime(250))
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith('x', undefined, true)
  })

  it('forwards the selected kind filter to the catalog query', () => {
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    act(() => result.current.handleFilterChange('resale'))

    expect(result.current.kind).toBe('resale')
    expect(useComboProductsQueryMock).toHaveBeenLastCalledWith(undefined, 'resale', true)
  })

  it('maps unavailable rows with their reason and ignores their selection', () => {
    useComboProductsQueryMock.mockReturnValue({
      catalogError: null,
      catalogPage: {
        items: [portionProduct, outOfStockProduct, missingPriceProduct],
        page: 1,
        pageSize: 50,
        total: 3,
        totalPages: 1,
      },
      isCatalogError: false,
      isLoadingCatalog: false,
      isRefreshingCatalog: false,
    } as never)
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    expect(
      result.current.productRows.map(({ product, unavailableReason }) => [
        product.productId,
        unavailableReason,
      ]),
    ).toEqual([
      ['portion-2', undefined],
      ['resale-out-of-stock', 'out_of_stock'],
      ['resale-missing-price', 'missing_price'],
    ])

    act(() => result.current.handleSelectProduct(portionProduct))
    act(() => result.current.handleSelectProduct(outOfStockProduct))
    act(() => result.current.handleSelectProduct(missingPriceProduct))

    expect(result.current.selectedProduct).toBe(portionProduct)
    act(() => result.current.handleAdd())
    expect(result.current.configurationError).toBeNull()
  })

  it('does not select an unavailable product when nothing was selected before', () => {
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    act(() => result.current.handleSelectProduct(outOfStockProduct))

    expect(result.current.selectedProduct).toBeUndefined()
    expect(result.current.isValidConfiguration).toBe(false)
  })

  it('presents an item without availability from isAvailable', () => {
    const { availability: _portionAvailability, ...legacyAvailable } = portionProduct
    const { availability: _resaleAvailability, ...legacyUnavailable } = {
      ...resaleProduct,
      isAvailable: false,
      productId: 'legacy-unavailable',
    }
    useComboProductsQueryMock.mockReturnValue({
      catalogError: null,
      catalogPage: {
        items: [legacyAvailable, legacyUnavailable],
        page: 1,
        pageSize: 50,
        total: 2,
        totalPages: 1,
      },
      isCatalogError: false,
      isLoadingCatalog: false,
      isRefreshingCatalog: false,
    } as never)
    const { result } = renderHook(() =>
      useComboProductDialog({
        existingProductIds: [],
        onAdd: vi.fn(),
        onOpenChange: vi.fn(),
        open: true,
      }),
    )

    expect(result.current.productRows.map((row) => row.unavailableReason)).toEqual([
      undefined,
      'out_of_stock',
    ])

    act(() => result.current.handleSelectProduct(legacyUnavailable as never))
    expect(result.current.selectedProduct).toBeUndefined()
    act(() => result.current.handleSelectProduct(legacyAvailable as never))
    expect(result.current.selectedProduct?.productId).toBe('portion-2')
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
      isRefreshingCatalog: false,
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
      isRefreshingCatalog: false,
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
