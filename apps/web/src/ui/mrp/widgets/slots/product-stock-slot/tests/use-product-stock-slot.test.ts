import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker, ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type {
  ProductBrandStock,
  ProductStockDetails,
} from '@scoops/core/mrp/domain/structures'

import { useProductStockQuery } from '../../../../hooks/use-product-stock-query'
import { useSetPrimaryProductBrandAction } from '../../../../hooks/use-set-primary-product-brand-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { showErrorToast } from '@/ui/shared/notifications'

import { useProductStockSlot } from '../use-product-stock-slot'

vi.mock('../../../../hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-set-primary-product-brand-action', () => ({
  useSetPrimaryProductBrandAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useSetPrimaryProductBrandActionMock = vi.mocked(useSetPrimaryProductBrandAction)
const useNavigationMock = vi.mocked(useNavigation)
const showErrorToastMock = vi.mocked(showErrorToast)

describe('useProductStockSlot', () => {
  const product = ProductFaker.fake({
    id: 'product-1',
    name: 'Polpa de morango',
    stockControl: 'by-brand',
  })
  const brand = BrandFaker.fake({ productId: product.id, id: 'brand-1', name: 'Frooty' })
  const productBrandStock: ProductBrandStock = {
    brand,
    stockQuantity: 10,
    unitPrice: 4,
  }
  const productStock: ProductStockDetails = {
    product,
    stockQuantity: 10,
    idealStock: 12,
    stockSituation: 'normal',
    brands: [productBrandStock],
  }

  let refetchMock: ReturnType<typeof vi.fn>
  let navigateToMock: ReturnType<typeof vi.fn>
  let setPrimaryProductBrandMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    refetchMock = vi.fn().mockResolvedValue(undefined)
    navigateToMock = vi.fn().mockResolvedValue(undefined)
    setPrimaryProductBrandMock = vi.fn().mockResolvedValue(undefined)

    useProductStockQueryMock.mockReturnValue({
      data: productStock,
      isError: false,
      isPending: false,
      refetch: refetchMock,
    } as never)
    useSetPrimaryProductBrandActionMock.mockReturnValue({
      isPending: false,
      setPrimaryProductBrand: setPrimaryProductBrandMock,
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo: navigateToMock } as never)
  })

  it('exposes product stock and query and action state', () => {
    const { result } = renderHook(() => useProductStockSlot(product.id))

    expect(result.current.productStock).toEqual(productStock)
    expect(result.current.selectedAction).toBeUndefined()
    expect(result.current.isBrandActionPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('selects every stock action and closes or refreshes them through its handlers', () => {
    const { result } = renderHook(() => useProductStockSlot(product.id))

    act(() => result.current.handleAddBrand())
    expect(result.current.selectedAction).toEqual({ kind: 'add-brand' })

    act(() => result.current.handleEditBrand(productBrandStock))
    expect(result.current.selectedAction).toEqual({
      kind: 'edit-brand',
      brand: productBrandStock,
    })

    act(() => result.current.handleDeleteBrand(productBrandStock))
    expect(result.current.selectedAction).toEqual({
      kind: 'delete-brand',
      brand: productBrandStock,
    })

    act(() => result.current.handleEntry(productBrandStock))
    expect(result.current.selectedAction).toEqual({
      kind: 'entry',
      brand: productBrandStock,
    })

    act(() => result.current.handleWriteOff(productBrandStock))
    expect(result.current.selectedAction).toEqual({
      kind: 'write-off',
      brand: productBrandStock,
    })

    act(() => result.current.handleActionOpenChange(true))
    expect(result.current.selectedAction).toEqual({
      kind: 'write-off',
      brand: productBrandStock,
    })

    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()

    act(() => result.current.handleEntry())
    expect(result.current.selectedAction).toEqual({ kind: 'entry' })
    act(() => result.current.handleActionSuccess())
    expect(result.current.selectedAction).toBeUndefined()
    expect(refetchMock).toHaveBeenCalledOnce()
  })

  it('retries the stock query and navigates back to products', () => {
    const { result } = renderHook(() => useProductStockSlot(product.id))

    act(() => result.current.handleRetry())
    act(() => result.current.handleBack())

    expect(refetchMock).toHaveBeenCalledOnce()
    expect(navigateToMock).toHaveBeenCalledWith('products')
  })

  it('sets a primary brand and refreshes the stock on success', async () => {
    const { result } = renderHook(() => useProductStockSlot(product.id))

    await act(async () => {
      await result.current.handleSetPrimaryBrand(productBrandStock)
    })

    expect(setPrimaryProductBrandMock).toHaveBeenCalledWith(brand.id)
    expect(refetchMock).toHaveBeenCalledOnce()
    expect(showErrorToastMock).not.toHaveBeenCalled()
  })

  it('exposes loading, error, and pending states and reports a primary-brand failure', async () => {
    useProductStockQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: true,
      refetch: refetchMock,
    } as never)
    useSetPrimaryProductBrandActionMock.mockReturnValue({
      isPending: true,
      setPrimaryProductBrand: setPrimaryProductBrandMock,
    } as never)
    setPrimaryProductBrandMock.mockRejectedValueOnce(new Error('Falha ao definir marca'))

    const { result } = renderHook(() => useProductStockSlot(product.id))

    expect(result.current.productStock).toBeUndefined()
    expect(result.current.isBrandActionPending).toBe(true)
    expect(result.current.isError).toBe(true)
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await result.current.handleSetPrimaryBrand(productBrandStock)
    })

    expect(refetchMock).not.toHaveBeenCalled()
    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível definir a marca como principal. Tente novamente.',
    )
  })
})
