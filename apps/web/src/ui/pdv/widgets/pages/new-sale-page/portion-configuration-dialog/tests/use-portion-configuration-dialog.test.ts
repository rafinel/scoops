import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePortionConfigurationDialog } from '../use-portion-configuration-dialog'

const product = {
  productId: 'product-portion',
  name: 'Taça',
  kind: 'portion' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  sizes: [
    {
      sizeId: 'size-1',
      name: 'Médio',
      quantity: 1,
      basePrice: 10,
      isActive: true,
      isAvailable: true,
      accompaniments: [],
    },
  ],
  resaleBrands: [],
}

describe('usePortionConfigurationDialog', () => {
  it('keeps quantity within the supported bounds and emits a canonical line', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      usePortionConfigurationDialog({
        isOpen: true,
        onOpenChange: vi.fn(),
        onSave,
        product,
      }),
    )

    act(() => result.current.handleQuantityChange(0))
    expect(result.current.quantity).toBe(1)
    act(() => result.current.handleSubmit())

    expect(onSave).toHaveBeenCalledWith({
      accompanimentIds: [],
      kind: 'portion',
      productId: 'product-portion',
      quantity: 1,
      sizeId: 'size-1',
    })
  })
})
