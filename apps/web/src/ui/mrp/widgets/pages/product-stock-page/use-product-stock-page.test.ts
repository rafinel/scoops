import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductStockPage } from './use-product-stock-page'

const refetchMock = vi.fn()
const navigateToMock = vi.fn()
const setPrimaryProductBrandMock = vi.fn()

vi.mock('../../../hooks/use-product-stock-query', () => ({
  useProductStockQuery: () => ({
    data: { product: {} },
    isError: false,
    isPending: false,
    refetch: refetchMock,
  }),
}))
vi.mock('../../../hooks/use-set-primary-product-brand-action', () => ({
  useSetPrimaryProductBrandAction: () => ({
    isPending: false,
    setPrimaryProductBrand: setPrimaryProductBrandMock,
  }),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

describe('useProductStockPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('owns selection, close, refresh, navigation, and primary-brand transitions', async () => {
    setPrimaryProductBrandMock.mockResolvedValue(undefined)
    const brand = { brand: { id: 'brand-1' } } as never
    const { result } = renderHook(() => useProductStockPage('product-1'))

    act(() => result.current.handleAddBrand())
    expect(result.current.selectedAction).toEqual({ kind: 'add-brand' })
    act(() => result.current.handleEditBrand(brand))
    expect(result.current.selectedAction).toEqual({ kind: 'edit-brand', brand })
    act(() => result.current.handleEntry(brand))
    expect(result.current.selectedAction).toEqual({ kind: 'entry', brand })
    act(() => result.current.handleActionOpenChange(false))
    expect(result.current.selectedAction).toBeUndefined()
    act(() => result.current.handleBack())
    expect(navigateToMock).toHaveBeenCalledWith('products')

    await act(() => result.current.handleSetPrimaryBrand(brand))
    expect(setPrimaryProductBrandMock).toHaveBeenCalledWith('brand-1')
    expect(refetchMock).toHaveBeenCalled()

    act(() => result.current.handleDeleteBrand(brand))
    act(() => result.current.handleActionSuccess())
    expect(result.current.selectedAction).toBeUndefined()
    expect(refetchMock).toHaveBeenCalledTimes(2)
  })
})
