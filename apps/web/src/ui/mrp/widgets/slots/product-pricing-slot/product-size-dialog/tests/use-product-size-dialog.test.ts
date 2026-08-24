import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterProductSizeAction } from '@/ui/mrp/hooks/use-register-product-size-action'
import { useUpdateProductSizeAction } from '@/ui/mrp/hooks/use-update-product-size-action'

import { useProductSizeDialog } from '../use-product-size-dialog'

vi.mock('@/ui/mrp/hooks/use-register-product-size-action', () => ({
  useRegisterProductSizeAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-update-product-size-action', () => ({
  useUpdateProductSizeAction: vi.fn(),
}))

const useRegisterProductSizeActionMock = vi.mocked(useRegisterProductSizeAction)
const useUpdateProductSizeActionMock = vi.mocked(useUpdateProductSizeAction)

const baseProps = {
  isOpen: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn(),
  productId: 'product-1',
}

const editProps = {
  ...baseProps,
  size: {
    size: {
      id: 'size-1',
      establishmentId: 'establishment-1',
      productId: 'product-1',
      name: '300 ml',
      quantity: 0.3,
      price: 18.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
}

describe('useProductSizeDialog', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useRegisterProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductSize: vi.fn().mockResolvedValue(undefined),
    })
    useUpdateProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductSize: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('parses comma decimal prices before registering a size', async () => {
    const registerProductSizeMock = vi.fn().mockResolvedValue(undefined)
    useRegisterProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerProductSize: registerProductSizeMock,
    })
    const { result } = renderHook(() => useProductSizeDialog(baseProps))
    const name = result.current.register('name')
    const quantity = result.current.register('quantity')
    const price = result.current.register('price')
    const nameField = document.createElement('input')
    const quantityField = document.createElement('input')
    const priceField = document.createElement('input')
    nameField.name = name.name
    quantityField.name = quantity.name
    priceField.name = price.name
    document.body.append(nameField, quantityField, priceField)
    name.ref(nameField)
    quantity.ref(quantityField)
    price.ref(priceField)

    await act(async () => {
      nameField.value = ' 500 ml '
      quantityField.value = '0.5'
      priceField.value = '27,50'
      await name.onChange({ target: nameField })
      await quantity.onChange({ target: quantityField })
      await price.onChange({ target: priceField })
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(registerProductSizeMock).toHaveBeenCalledWith({
      name: '500 ml',
      quantity: 0.5,
      price: 27.5,
    })
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(baseProps.onSuccess).toHaveBeenCalledTimes(1)
  })

  it('submits edits through the update action with the selected size id', async () => {
    const updateProductSizeMock = vi.fn().mockResolvedValue(undefined)
    useUpdateProductSizeActionMock.mockReturnValue({
      error: null,
      isPending: false,
      updateProductSize: updateProductSizeMock,
    })
    const { result } = renderHook(() => useProductSizeDialog(editProps))
    const name = result.current.register('name')
    const quantity = result.current.register('quantity')
    const price = result.current.register('price')
    const isActive = result.current.register('isActive')
    const nameField = document.createElement('input')
    const quantityField = document.createElement('input')
    const priceField = document.createElement('input')
    const isActiveField = document.createElement('input')
    isActiveField.type = 'checkbox'
    nameField.name = name.name
    quantityField.name = quantity.name
    priceField.name = price.name
    isActiveField.name = isActive.name
    document.body.append(nameField, quantityField, priceField, isActiveField)
    name.ref(nameField)
    quantity.ref(quantityField)
    price.ref(priceField)
    isActive.ref(isActiveField)

    await act(async () => {
      nameField.value = '500 ml'
      quantityField.value = '0.5'
      priceField.value = '27,50'
      isActiveField.checked = true
      await name.onChange({ target: nameField })
      await quantity.onChange({ target: quantityField })
      await price.onChange({ target: priceField })
      await isActive.onChange({ target: isActiveField })
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(updateProductSizeMock).toHaveBeenCalledWith({
      sizeId: 'size-1',
      input: { name: '500 ml', quantity: 0.5, price: 27.5, isActive: true },
    })
  })
})
