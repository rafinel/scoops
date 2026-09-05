import { act, renderHook } from '@testing-library/react'
import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useRemoveProductBrandAction } from '@/ui/mrp/hooks/use-remove-product-brand-action'
import { showErrorToast } from '@/ui/shared/notifications'

import { useRemoveProductBrandDialog } from '../use-remove-product-brand-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-product-brand-action', () => ({
  useRemoveProductBrandAction: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useRemoveProductBrandActionMock = vi.mocked(useRemoveProductBrandAction)
const showErrorToastMock = vi.mocked(showErrorToast)

describe('useRemoveProductBrandDialog', () => {
  const brand: ProductBrandStock = {
    brand: BrandFaker.fake({
      id: 'brand-1',
      name: 'Frooty',
      productId: 'product-1',
    }),
    stockQuantity: 10,
    unitPrice: 4,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductBrand: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('propagates action state and blocks open changes while pending', () => {
    const error = new Error('Não foi possível excluir a marca')
    const onOpenChange = vi.fn()
    const removeProductBrand = vi.fn()
    useRemoveProductBrandActionMock.mockReturnValue({
      error,
      isPending: true,
      removeProductBrand,
    })

    const { result, rerender } = renderHook(() =>
      useRemoveProductBrandDialog({
        brand,
        onOpenChange,
        open: true,
        productId: 'product-1',
      }),
    )

    expect(result.current.error).toBe(error)
    expect(result.current.isPending).toBe(true)

    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).not.toHaveBeenCalled()

    useRemoveProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductBrand,
    })
    rerender()

    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('removes the brand and closes the dialog on success', async () => {
    const removeProductBrand = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    useRemoveProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductBrand,
    })

    const { result } = renderHook(() =>
      useRemoveProductBrandDialog({
        brand,
        onOpenChange,
        onSuccess,
        open: true,
        productId: 'product-1',
      }),
    )

    await act(async () => result.current.handleConfirm())

    expect(removeProductBrand).toHaveBeenCalledOnce()
    expect(removeProductBrand).toHaveBeenCalledWith(brand.brand.id)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(showErrorToastMock).not.toHaveBeenCalled()
  })

  it('notifies the user and keeps the dialog open when removal fails', async () => {
    const removeProductBrand = vi.fn().mockRejectedValue(new Error('Falha'))
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    useRemoveProductBrandActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductBrand,
    })

    const { result } = renderHook(() =>
      useRemoveProductBrandDialog({
        brand,
        onOpenChange,
        onSuccess,
        open: true,
        productId: 'product-1',
      }),
    )

    await act(async () => result.current.handleConfirm())

    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível excluir a marca. Corrija o impedimento e tente novamente.',
    )
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
