import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useNewSaleCart } from '../use-new-sale-cart'

describe('useNewSaleCart', () => {
  it('guards registration and confirms clearing the local cart', () => {
    const onClear = vi.fn()
    const onRegister = vi.fn()
    const props = {
      canRegister: false,
      channels: [],
      isPreviewPending: false,
      lineInputs: [
        {
          accompanimentIds: [],
          kind: 'resale' as const,
          productId: 'product-1',
          quantity: 1,
        },
      ],
      products: [],
      onChannelChange: vi.fn(),
      onClear,
      onEditLine: vi.fn(),
      onQuantityChange: vi.fn(),
      onRegister,
      onRemoveLine: vi.fn(),
      previewCart: undefined,
    }
    const { result } = renderHook(() => useNewSaleCart(props))

    act(() => result.current.handleRegister())
    act(() => result.current.handleOpenClearConfirmation())
    expect(onRegister).not.toHaveBeenCalled()
    expect(result.current.isClearConfirmationOpen).toBe(true)
    act(() => result.current.handleConfirmClear())

    expect(onClear).toHaveBeenCalledOnce()
    expect(result.current.isClearConfirmationOpen).toBe(false)
  })
})
