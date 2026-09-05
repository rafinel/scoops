import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { StockAdjustmentDialog } from '..'

import { useStockAdjustmentDialog } from '../use-stock-adjustment-dialog'

vi.mock('../use-stock-adjustment-dialog', () => ({
  useStockAdjustmentDialog: vi.fn(),
}))

const useStockAdjustmentDialogMock = vi.mocked(useStockAdjustmentDialog)
const handleInputModeChangeMock = vi.fn()
const handleSubmitMock = vi.fn()

describe('StockAdjustmentDialog', () => {
  function fakeProps(
    overrides: Partial<ComponentProps<typeof StockAdjustmentDialog>> = {},
  ) {
    return {
      allowNegativeStock: false,
      currentBalance: 10,
      isOpen: true,
      productId: 'product-1',
      type: 'entry' as const,
      unit: 'kg' as const,
      brand: fakeBrandStock(),
      onOpenChange: vi.fn(),
      onSuccess: vi.fn(),
      ...overrides,
    }
  }

  function fakeStockAdjustmentDialog(
    overrides: Partial<ReturnType<typeof useStockAdjustmentDialog>> = {},
  ): ReturnType<typeof useStockAdjustmentDialog> {
    return {
      baseQuantity: 6,
      errors: {},
      formError: null,
      handleInputModeChange: handleInputModeChangeMock,
      handleQuantityChange: vi.fn(),
      handleSubmit: handleSubmitMock,
      inputMode: 'package',
      handleJustificationChange: vi.fn(),
      justification: '',
      isInsufficient: false,
      isPending: false,
      prospectiveBalance: 16,
      quantity: '3',
      register: vi.fn(() => ({})) as never,
      ...overrides,
    }
  }

  function fakeBrandStock() {
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

  beforeEach(() => {
    vi.clearAllMocks()
    useStockAdjustmentDialogMock.mockReturnValue(fakeStockAdjustmentDialog())
  })

  afterEach(cleanup)

  it('renders the package conversion and delegates its mode selection', () => {
    render(<StockAdjustmentDialog {...fakeProps()} />)

    expect(screen.getByText(/3 × 2 kg/)).not.toBeNull()
    expect(screen.getByText(/^6 kg$/)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Unidade base (kg)' }))

    expect(handleInputModeChangeMock).toHaveBeenCalledWith('baseUnit')
  })

  it('renders and labels the optional justification field', () => {
    render(<StockAdjustmentDialog {...fakeProps()} />)
    expect(screen.getByRole('textbox', { name: /Justificativa/ })).not.toBeNull()
  })

  it('does not expose product cost in the transaction dialog', () => {
    render(<StockAdjustmentDialog {...fakeProps({ brand: undefined })} />)

    expect(screen.queryByRole('spinbutton', { name: /Custo unitário/ })).toBeNull()
  })

  it('delegates the confirmed adjustment to its hook', () => {
    render(<StockAdjustmentDialog {...fakeProps()} />)

    const form = screen.getByRole('button', { name: 'Confirmar entrada' }).closest('form')
    if (!form) throw new Error('Missing stock adjustment form')
    fireEvent.submit(form)

    expect(handleSubmitMock).toHaveBeenCalledOnce()
  })

  it('blocks a known insufficient write-off without exposing confirmation', () => {
    useStockAdjustmentDialogMock.mockReturnValue(
      fakeStockAdjustmentDialog({
        isInsufficient: true,
        prospectiveBalance: -1,
      }),
    )
    render(<StockAdjustmentDialog {...fakeProps({ type: 'write-off' })} />)

    expect(screen.getByRole('alert').textContent).toContain('Estoque insuficiente')
    expect(
      (screen.getByRole('button', { name: 'Confirmar baixa' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
