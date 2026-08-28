import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useResaleConfigurationDialog } from '../use-resale-configuration-dialog'

const product = {
  productId: 'product-resale',
  name: 'Pote pronto',
  kind: 'resale' as const,
  stockControl: 'by-brand' as const,
  isActive: true,
  isAvailable: true,
  sizes: [],
  resaleBrands: [
    {
      brandId: 'brand-1',
      name: 'Marca',
      basePrice: 15,
      isActive: true,
      isAvailable: true,
    },
  ],
}

describe('useResaleConfigurationDialog', () => {
  it('preserves an existing line while editing', () => {
    const onSave = vi.fn()
    const { result } = renderHook(() =>
      useResaleConfigurationDialog({
        initialLine: {
          accompanimentIds: [],
          brandId: 'brand-1',
          kind: 'resale',
          productId: 'product-resale',
          quantity: 3,
        },
        isOpen: true,
        onOpenChange: vi.fn(),
        onSave,
        product,
      }),
    )

    act(() => result.current.handleSubmit())

    expect(onSave).toHaveBeenCalledWith({
      accompanimentIds: [],
      brandId: 'brand-1',
      kind: 'resale',
      productId: 'product-resale',
      quantity: 3,
    })
  })
})
