import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRemoveProductAccompanimentAction } from '@/ui/mrp/hooks/use-remove-product-accompaniment-action'

import { useRemoveProductAccompanimentDialog } from '../use-remove-product-accompaniment-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-product-accompaniment-action', () => ({
  useRemoveProductAccompanimentAction: vi.fn(),
}))

const useRemoveProductAccompanimentActionMock = vi.mocked(
  useRemoveProductAccompanimentAction,
)

describe('useRemoveProductAccompanimentDialog', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes the link and completes the success callback', async () => {
    const removeProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment,
    } as never)

    const { result } = renderHook(() =>
      useRemoveProductAccompanimentDialog({
        itemId: 'link-1',
        onSuccess,
        productId: 'product-1',
      }),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(removeProductAccompaniment).toHaveBeenCalledWith('link-1')
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('maps a removal failure to the dialog error state', async () => {
    useRemoveProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeProductAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)

    const { result } = renderHook(() =>
      useRemoveProductAccompanimentDialog({
        itemId: 'link-1',
        onSuccess: vi.fn(),
        productId: 'product-1',
      }),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.actionError).toBe('request failed')
  })
})
