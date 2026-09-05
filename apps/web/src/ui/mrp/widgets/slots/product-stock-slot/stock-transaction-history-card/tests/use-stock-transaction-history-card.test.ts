import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { useStockTransactionsQuery } from '@/ui/mrp/hooks/use-stock-transactions-query'

import { useStockTransactionHistoryCard } from '../use-stock-transaction-history-card'

vi.mock('@/ui/mrp/hooks/use-stock-transactions-query', () => ({
  useStockTransactionsQuery: vi.fn(),
}))

const useStockTransactionsQueryMock = vi.mocked(useStockTransactionsQuery)

describe('useStockTransactionHistoryCard', () => {
  const transactionsPage = {
    items: [],
    page: 1,
    limit: 5,
    total: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns query data, status, initial filters and a refetch action', () => {
    const refetch = vi.fn()
    useStockTransactionsQueryMock.mockReturnValue({
      data: transactionsPage,
      isError: false,
      isPending: true,
      refetch,
    } as never)

    const { result } = renderHook(() =>
      useStockTransactionHistoryCard('product-1', [
        {
          brand: BrandFaker.fake({
            id: 'brand-1',
            productId: 'product-1',
            name: 'Frooty',
            packageQuantity: 2,
            packagePrice: 8,
            isPrimary: true,
          }),
          stockQuantity: 10,
          unitPrice: 4,
        },
      ]),
    )

    expect(result.current).toMatchObject({
      brandId: '',
      from: '',
      hasFilters: false,
      isError: false,
      isLoading: true,
      refetch,
      selectedBrandName: undefined,
      to: '',
      transactionsPage,
      type: '',
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith('product-1', {
      brandId: undefined,
      from: undefined,
      limit: 5,
      page: 1,
      to: undefined,
      type: undefined,
    })

    act(() => result.current.refetch())
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('applies type, brand and date filters while converting dates for the query', () => {
    const brand = {
      brand: BrandFaker.fake({
        id: 'brand-1',
        productId: 'product-1',
        name: 'Frooty',
        packageQuantity: 2,
        packagePrice: 8,
        isPrimary: true,
      }),
      stockQuantity: 10,
      unitPrice: 4,
    }
    useStockTransactionsQueryMock.mockReturnValue({
      data: transactionsPage,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useStockTransactionHistoryCard('product-1', [brand]),
    )

    act(() => {
      result.current.handleTypeChange('sale-cancellation')
      result.current.handleBrandChange(brand.brand.id)
      result.current.handleFromChange('2026-08-01')
      result.current.handleToChange('2026-08-22')
    })

    expect(result.current).toMatchObject({
      brandId: brand.brand.id,
      from: '2026-08-01',
      hasFilters: true,
      selectedBrandName: 'Frooty',
      to: '2026-08-22',
      type: 'sale-cancellation',
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith('product-1', {
      brandId: brand.brand.id,
      from: new Date('2026-08-01T00:00:00.000'),
      limit: 5,
      page: 1,
      to: new Date('2026-08-22T23:59:59.999'),
      type: 'sale-cancellation',
    })
  })

  it('clears individual filter values and resets all filters and pagination', () => {
    const brand = {
      brand: BrandFaker.fake({
        id: 'brand-1',
        productId: 'product-1',
        name: 'Frooty',
        packageQuantity: 2,
        packagePrice: 8,
        isPrimary: true,
      }),
      stockQuantity: 10,
      unitPrice: 4,
    }
    useStockTransactionsQueryMock.mockReturnValue({
      data: transactionsPage,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useStockTransactionHistoryCard('product-1', [brand]),
    )

    act(() => {
      result.current.handleTypeChange('sale')
      result.current.handleBrandChange(brand.brand.id)
      result.current.handleFromChange('2026-08-01')
      result.current.handleToChange('2026-08-22')
      result.current.handlePageChange(3)
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith(
      'product-1',
      expect.objectContaining({ page: 3 }),
    )

    act(() => {
      result.current.handleTypeChange('all')
      result.current.handleBrandChange(null)
      result.current.handleFromChange('')
      result.current.handleToChange('')
    })

    expect(result.current).toMatchObject({
      brandId: '',
      from: '',
      hasFilters: false,
      selectedBrandName: undefined,
      to: '',
      type: '',
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith('product-1', {
      brandId: undefined,
      from: undefined,
      limit: 5,
      page: 1,
      to: undefined,
      type: undefined,
    })

    act(() => {
      result.current.handleTypeChange(null)
      result.current.handleBrandChange('all')
      result.current.handlePageChange(4)
      result.current.handleClearFilters()
    })

    expect(result.current).toMatchObject({
      brandId: '',
      from: '',
      hasFilters: false,
      to: '',
      type: '',
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith(
      'product-1',
      expect.objectContaining({ page: 1 }),
    )
  })

  it('exposes loading and error states from the transactions query', () => {
    const refetch = vi.fn()
    useStockTransactionsQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch,
    } as never)

    const { result } = renderHook(() => useStockTransactionHistoryCard('product-1', []))

    expect(result.current.isError).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.transactionsPage).toBeUndefined()
    act(() => result.current.handlePageChange(2))
    expect(result.current).toMatchObject({
      hasFilters: false,
    })
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith(
      'product-1',
      expect.objectContaining({ page: 2 }),
    )
  })
})
