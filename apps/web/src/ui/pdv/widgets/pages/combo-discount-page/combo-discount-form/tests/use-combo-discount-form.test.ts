import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { comboDetails } from '../../tests/combo-test-fixtures'
import { useComboDiscountForm } from '../use-combo-discount-form'

describe('useComboDiscountForm', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads existing components, recalculates quantity pricing, and removes a component', () => {
    const { result } = renderHook(() =>
      useComboDiscountForm({
        initialDetails: comboDetails,
        isPending: false,
        mode: 'edit',
        onCancel: vi.fn(),
        onRequestStatusChange: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined),
        submitError: null,
      }),
    )
    expect(result.current.componentDetails).toHaveLength(2)
    expect(result.current.normalPrice).toBe(24)
    expect(result.current.savings).toBe(4)

    act(() => result.current.handleQuantityChange(0, 2.8))
    expect(result.current.componentDetails[0]?.component.quantity).toBe(2)
    expect(result.current.componentDetails[0]?.subtotal).toBe(28)

    const trigger = document.createElement('button')
    document.body.append(trigger)
    act(() => result.current.handleRequestRemoveComponent(0, trigger))
    expect(result.current.isRemoveProductDialogOpen).toBe(true)
    act(() => result.current.handleConfirmRemoveComponent())
    expect(result.current.componentDetails).toHaveLength(1)
    expect(result.current.resolveRemoveProductFinalFocus()).toBe(trigger)
  })

  it('rejects duplicate products, adds a new component, and tracks dialog state', () => {
    const { result } = renderHook(() =>
      useComboDiscountForm({
        initialDetails: comboDetails,
        isPending: false,
        mode: 'create',
        onCancel: vi.fn(),
        onRequestStatusChange: vi.fn(),
        onSubmit: vi.fn().mockResolvedValue(undefined),
        submitError: null,
      }),
    )
    const duplicate = comboDetails.components[0]
    const added = {
      ...comboDetails.components[1],
      component: {
        ...comboDetails.components[1]?.component,
        productId: '11111111-1111-4111-8111-111111111116',
      },
      productName: 'Pudim',
    }
    if (!duplicate || !added) throw new Error('Missing fixture component')

    act(() => result.current.handleAddComponent({ ...duplicate }))
    expect(result.current.errors.components?.message).toBe(
      'Este produto já foi adicionado ao Combo.',
    )
    act(() => result.current.handleAddComponent({ ...added }))
    expect(result.current.componentDetails).toHaveLength(3)
    expect(result.current.isProductDialogOpen).toBe(false)

    act(() => result.current.handleOpenProductDialog())
    expect(result.current.isProductDialogOpen).toBe(true)
    act(() => result.current.handleProductDialogOpenChange(false))
    expect(result.current.isProductDialogOpen).toBe(false)
  })

  it('uses the edit status boundary and submits valid create values only when pricing is safe', async () => {
    const onRequestStatusChange = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useComboDiscountForm({
        initialDetails: comboDetails,
        isPending: false,
        mode: 'edit',
        onCancel: vi.fn(),
        onRequestStatusChange,
        onSubmit,
        submitError: null,
      }),
    )
    act(() => result.current.handleStatusChange('inactive'))
    expect(onRequestStatusChange).toHaveBeenCalledWith('inactive')
    await act(async () =>
      result.current.handleSubmit({ preventDefault: vi.fn() } as never),
    )
    expect(onSubmit).toHaveBeenCalledOnce()

    const unsafeSubmit = vi.fn().mockResolvedValue(undefined)
    const unsafeDetails = {
      ...comboDetails,
      combo: { ...comboDetails.combo, fixedPrice: 30 },
    }
    const unsafe = renderHook(() =>
      useComboDiscountForm({
        initialDetails: unsafeDetails,
        isPending: false,
        mode: 'create',
        onCancel: vi.fn(),
        onRequestStatusChange: vi.fn(),
        onSubmit: unsafeSubmit,
        submitError: null,
      }),
    )
    await act(async () =>
      unsafe.result.current.handleSubmit({ preventDefault: vi.fn() } as never),
    )
    expect(unsafeSubmit).not.toHaveBeenCalled()
    expect(unsafe.result.current.errors.fixedPrice?.message).toContain(
      'menor que o valor normal',
    )
  })
})
