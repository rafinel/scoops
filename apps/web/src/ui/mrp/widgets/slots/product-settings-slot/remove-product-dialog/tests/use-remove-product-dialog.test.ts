import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useProductRemovalImpactQuery } from '@/ui/mrp/hooks/use-product-removal-impact-query'
import { useRemoveProductAction } from '@/ui/mrp/hooks/use-remove-product-action'
import { showErrorToast } from '@/ui/shared/notifications'

import { useRemoveProductDialog } from '../use-remove-product-dialog'

vi.mock('@/ui/mrp/hooks/use-product-removal-impact-query', () => ({
  useProductRemovalImpactQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-remove-product-action', () => ({
  useRemoveProductAction: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useProductRemovalImpactQueryMock = vi.mocked(useProductRemovalImpactQuery)
const useRemoveProductActionMock = vi.mocked(useRemoveProductAction)
const showErrorToastMock = vi.mocked(showErrorToast)
const product = ProductFaker.fake({ id: 'product-1' })
const impact = {
  productRemovalImpact: undefined,
  productRemovalImpactError: null,
  hasProductRemovalImpactError: false,
  isLoadingProductRemovalImpact: false,
  isPendingProductRemovalImpact: false,
  retryProductRemovalImpact: vi.fn(),
}

describe('useRemoveProductDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductRemovalImpactQueryMock.mockReturnValue(impact as never)
    useRemoveProductActionMock.mockReturnValue({
      removeProduct: vi.fn().mockResolvedValue(undefined),
      removeProductError: null,
      isRemovingProduct: false,
    } as never)
  })

  it('passes impact state through and confirms removal', async () => {
    const removeProduct = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    useRemoveProductActionMock.mockReturnValue({
      removeProduct,
      removeProductError: null,
      isRemovingProduct: false,
    } as never)
    const { result } = renderHook(() =>
      useRemoveProductDialog({ onOpenChange, open: true, product }),
    )

    await act(async () => result.current.handleConfirm())
    act(() => result.current.handleOpenChange(false))

    expect(useProductRemovalImpactQueryMock).toHaveBeenCalledWith(product.id, true)
    expect(removeProduct).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(result.current.productRemovalImpact).toBeUndefined()
  })

  it('blocks closing while removing and reports removal failures', async () => {
    const onOpenChange = vi.fn()
    const removeProduct = vi.fn().mockRejectedValue(new Error('Falha'))
    useRemoveProductActionMock.mockReturnValue({
      removeProduct,
      removeProductError: null,
      isRemovingProduct: true,
    } as never)
    const { result, rerender } = renderHook(
      (open) => useRemoveProductDialog({ onOpenChange, open, product }),
      { initialProps: true },
    )

    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).not.toHaveBeenCalled()

    useRemoveProductActionMock.mockReturnValue({
      removeProduct,
      removeProductError: null,
      isRemovingProduct: false,
    } as never)
    rerender(true)
    await act(async () => result.current.handleConfirm())
    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível remover o produto. Tente novamente.',
    )
  })
})
