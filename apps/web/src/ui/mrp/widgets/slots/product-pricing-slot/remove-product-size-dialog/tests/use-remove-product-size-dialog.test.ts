import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRemoveProductSizeAction } from '@/ui/mrp/hooks/use-remove-product-size-action'

import { useRemoveProductSizeDialog } from '../use-remove-product-size-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-product-size-action', () => ({
  useRemoveProductSizeAction: vi.fn(),
}))

const useRemoveProductSizeActionMock = vi.mocked(useRemoveProductSizeAction)

const baseProps = {
  isOpen: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn().mockResolvedValue(undefined),
  productId: 'product-1',
  sizeId: 'size-1',
}

describe('useRemoveProductSizeDialog', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductSize: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('removes the size and completes the success flow', async () => {
    const removeProductSizeMock = vi.fn().mockResolvedValue(undefined)
    useRemoveProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductSize: removeProductSizeMock,
    })
    const { result } = renderHook(() => useRemoveProductSizeDialog(baseProps))

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(removeProductSizeMock).toHaveBeenCalledWith('size-1')
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(baseProps.onSuccess).toHaveBeenCalledTimes(1)
  })

  it('keeps the dialog open and exposes a failure message when removal fails', async () => {
    useRemoveProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      removeProductSize: vi.fn().mockRejectedValue(new Error('request failed')),
    })
    const { result } = renderHook(() => useRemoveProductSizeDialog(baseProps))

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.formError).toBe('request failed')
    expect(baseProps.onOpenChange).not.toHaveBeenCalled()
    expect(baseProps.onSuccess).not.toHaveBeenCalled()
  })
})
