import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StockAdjustmentDialog } from '.'

import { useStockAdjustmentDialog } from './use-stock-adjustment-dialog'

vi.mock('./use-stock-adjustment-dialog', () => ({
  useStockAdjustmentDialog: vi.fn(),
}))

const useStockAdjustmentDialogMock = vi.mocked(useStockAdjustmentDialog)
const handleInputModeChangeMock = vi.fn()
const handleSubmitMock = vi.fn()

describe('StockAdjustmentDialog', () => {
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
    brand: fakeBrand(),
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
    currentUnitCost: '',
    errors: {},
    formError: null,
    handleInputModeChange: handleInputModeChangeMock,
    handleQuantityChange: vi.fn(),
    handleSubmit: handleSubmitMock,
    inputMode: 'package',
    isInsufficient: false,
    isPending: false,
    prospectiveBalance: 16,
    quantity: '3',
    register: vi.fn(() => ({})) as never,
    ...overrides,
  }
}

function fakeBrand() {
  const now = new Date('2026-08-22T12:00:00.000Z')
  return {
    brand: {
      id: 'brand-1',
      productId: 'product-1',
      name: 'Frooty',
      packageQuantity: 2,
      packagePrice: 8,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
    stockQuantity: 10,
    unitPrice: 4,
  }
}
