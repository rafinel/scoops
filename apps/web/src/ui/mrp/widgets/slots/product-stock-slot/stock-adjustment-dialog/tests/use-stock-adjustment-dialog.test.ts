import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useAdjustProductStockAction } from '@/ui/mrp/hooks/use-adjust-product-stock-action'

import { useStockAdjustmentDialog } from '../use-stock-adjustment-dialog'

vi.mock('@/ui/mrp/hooks/use-adjust-product-stock-action', () => ({
  useAdjustProductStockAction: vi.fn(),
}))

const useAdjustProductStockActionMock = vi.mocked(useAdjustProductStockAction)

describe('useStockAdjustmentDialog', () => {
  function createProps(
    overrides: Partial<Parameters<typeof useStockAdjustmentDialog>[0]> = {},
  ) {
    return {
      allowNegativeStock: false,
      currentBalance: 10,
      isOpen: true,
      productId: 'product-1',
      type: 'entry' as const,
      onOpenChange: vi.fn(),
      onSuccess: vi.fn(),
      ...overrides,
    }
  }

  function createBrandStock() {
    return {
      brand: BrandFaker.fake({
        id: 'brand-1',
        productId: 'product-1',
        name: 'Frooty',
        packageQuantity: 2,
        packagePrice: 8,
        isPrimary: true,
      }),
      stockQuantity: 10,
      unitPrice: 4,
    }
  }

  function attachField(
    result: { current: ReturnType<typeof useStockAdjustmentDialog> },
    name: 'quantity' | 'justification',
  ) {
    const registration = result.current.register(name)
    const field = document.createElement('input')
    field.name = registration.name
    document.body.append(field)
    registration.ref(field)
    return { field, registration }
  }

  async function changeField(input: ReturnType<typeof attachField>, value: string) {
    await act(async () => {
      input.field.value = value
      await input.registration.onChange({
        target: input.field,
        type: 'change',
      })
    })
  }

  async function submit(result: {
    current: ReturnType<typeof useStockAdjustmentDialog>
  }) {
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as never)
    })
  }

  afterEach(() => {
    cleanup()
    document.body.replaceChildren()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock: vi.fn().mockResolvedValue(undefined),
      error: null,
      isPending: false,
    })
  })

  it('exposes initial state and derives base quantities when changing input mode', async () => {
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock: vi.fn(),
      error: null,
      isPending: true,
    })
    const props = createProps({ brand: createBrandStock() })
    const { result } = renderHook(() => useStockAdjustmentDialog(props))

    expect(result.current.baseQuantity).toBe(0)
    expect(result.current.errors).toEqual({})
    expect(result.current.formError).toBeNull()
    expect(result.current.inputMode).toBe('baseUnit')
    expect(result.current.isInsufficient).toBe(false)
    expect(result.current.isPending).toBe(true)
    expect(result.current.justification).toBe('')
    expect(result.current.prospectiveBalance).toBe(10)
    expect(result.current.quantity).toBe('')
    expect(typeof result.current.handleInputModeChange).toBe('function')
    expect(typeof result.current.handleJustificationChange).toBe('function')
    expect(typeof result.current.handleQuantityChange).toBe('function')
    expect(typeof result.current.handleSubmit).toBe('function')
    expect(typeof result.current.register).toBe('function')

    await act(async () => {
      result.current.handleInputModeChange('package')
    })
    expect(result.current.inputMode).toBe('package')

    const quantity = attachField(result, 'quantity')
    await changeField(quantity, '3')

    expect(result.current.quantity).toBe('3')
    expect(result.current.baseQuantity).toBe(6)
    expect(result.current.prospectiveBalance).toBe(16)
  })

  it('submits a trimmed base-unit entry and resets the form after success', async () => {
    const adjustProductStock = vi.fn().mockResolvedValue({ quantity: 12 })
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock,
      error: null,
      isPending: false,
    })
    const props = createProps()
    const { result } = renderHook(() => useStockAdjustmentDialog(props))
    const quantity = attachField(result, 'quantity')
    const justification = attachField(result, 'justification')
    await changeField(quantity, '2')
    await changeField(justification, '  Reposição  ')

    await submit(result)

    expect(adjustProductStock).toHaveBeenCalledWith({
      brandId: undefined,
      justification: 'Reposição',
      quantity: 2,
      type: 'entry',
    })
    expect(result.current.quantity).toBe('')
    expect(result.current.justification).toBe('')
    expect(result.current.formError).toBeNull()
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(props.onSuccess).toHaveBeenCalledOnce()
  })

  it('converts package quantities and includes the selected brand in the adjustment', async () => {
    const adjustProductStock = vi.fn().mockResolvedValue(undefined)
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock,
      error: null,
      isPending: false,
    })
    const brand = createBrandStock()
    const { result } = renderHook(() =>
      useStockAdjustmentDialog(createProps({ brand, currentBalance: 10, type: 'entry' })),
    )
    await act(async () => {
      result.current.handleInputModeChange('package')
    })
    const quantity = attachField(result, 'quantity')
    await changeField(quantity, '3')

    expect(result.current.baseQuantity).toBe(6)
    expect(result.current.prospectiveBalance).toBe(16)

    await submit(result)

    expect(adjustProductStock).toHaveBeenCalledWith({
      brandId: brand.brand.id,
      justification: undefined,
      quantity: 6,
      type: 'entry',
    })
  })

  it('reports validation errors for an invalid quantity and missing package conversion', async () => {
    const first = renderHook(() => useStockAdjustmentDialog(createProps()))
    attachField(first.result, 'quantity')

    await submit(first.result)

    expect(first.result.current.errors.quantity?.message).toBe(
      'Informe uma quantidade maior que zero.',
    )

    first.unmount()
    const second = renderHook(() => useStockAdjustmentDialog(createProps()))
    await act(async () => {
      second.result.current.handleInputModeChange('package')
    })
    const quantity = attachField(second.result, 'quantity')
    await changeField(quantity, '2')

    await submit(second.result)

    expect(second.result.current.errors.quantity?.message).toBe(
      'Não foi possível calcular a quantidade por embalagem.',
    )
  })

  it('updates justification state and clears a mutation error through its handlers', async () => {
    const adjustProductStock = vi.fn().mockRejectedValue(new Error('Saldo inválido'))
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock,
      error: null,
      isPending: false,
    })
    const { result } = renderHook(() => useStockAdjustmentDialog(createProps()))
    const quantity = attachField(result, 'quantity')
    const justification = attachField(result, 'justification')
    await changeField(quantity, '2')
    await changeField(justification, 'Motivo da entrada')

    expect(result.current.quantity).toBe('2')
    expect(result.current.justification).toBe('Motivo da entrada')
    await submit(result)
    expect(result.current.formError).toBe('Saldo inválido')

    await act(async () => {
      result.current.handleQuantityChange()
    })
    expect(result.current.formError).toBeNull()

    await submit(result)
    expect(result.current.formError).toBe('Saldo inválido')
    await act(async () => {
      result.current.handleJustificationChange()
    })
    expect(result.current.formError).toBeNull()
    expect(adjustProductStock).toHaveBeenCalledTimes(2)
  })

  it('uses the fallback message for failures without a usable error message', async () => {
    const adjustProductStock = vi.fn().mockRejectedValue(new Error(''))
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock,
      error: null,
      isPending: false,
    })
    const { result } = renderHook(() => useStockAdjustmentDialog(createProps()))
    const quantity = attachField(result, 'quantity')
    await changeField(quantity, '1')

    await submit(result)

    expect(result.current.formError).toBe(
      'Não foi possível movimentar o estoque. Tente novamente.',
    )
  })

  it('blocks insufficient write-offs and allows them when negative stock is enabled', async () => {
    const adjustProductStock = vi.fn().mockResolvedValue(undefined)
    useAdjustProductStockActionMock.mockReturnValue({
      adjustProductStock,
      error: null,
      isPending: false,
    })
    const props = createProps({
      allowNegativeStock: false,
      currentBalance: 10,
      type: 'write-off',
    })
    const { result } = renderHook(() => useStockAdjustmentDialog(props))
    const quantity = attachField(result, 'quantity')
    await changeField(quantity, '11')

    expect(result.current.baseQuantity).toBe(11)
    expect(result.current.prospectiveBalance).toBe(-1)
    expect(result.current.isInsufficient).toBe(true)
    await submit(result)
    expect(adjustProductStock).not.toHaveBeenCalled()
    expect(props.onOpenChange).not.toHaveBeenCalled()
    expect(props.onSuccess).not.toHaveBeenCalled()

    const allowed = renderHook(() =>
      useStockAdjustmentDialog(
        createProps({ allowNegativeStock: true, currentBalance: 10, type: 'write-off' }),
      ),
    )
    const allowedQuantity = attachField(allowed.result, 'quantity')
    await changeField(allowedQuantity, '11')

    expect(allowed.result.current.isInsufficient).toBe(false)
    expect(allowed.result.current.prospectiveBalance).toBe(-1)
  })
})
