import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StockAdjustmentDialog } from '.'

const adjustProductStockMock = vi.fn()
vi.mock('@/ui/mrp/hooks/use-adjust-product-stock-action', () => ({
  useAdjustProductStockAction: () => ({
    adjustProductStock: adjustProductStockMock,
    isPending: false,
  }),
}))

describe('StockAdjustmentDialog', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('converts packages to base units and reports the exact service input', async () => {
    adjustProductStockMock.mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    render(
      <StockAdjustmentDialog
        {...createProps()}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Embalagens' }))
    fireEvent.change(getQuantityInput(), { target: { value: '3' } })
    expect(screen.getByText(/3 × 2 kg/)).toBeTruthy()
    expect(screen.getByText(/^6 kg$/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrada' }))

    await waitFor(() =>
      expect(adjustProductStockMock).toHaveBeenCalledWith({
        brandId: 'brand-1',
        quantity: 6,
        type: 'entry',
      }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('blocks a known insufficient write-off before the service boundary', () => {
    render(
      <StockAdjustmentDialog
        {...createProps()}
        type='write-off'
        currentBalance={2}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(getQuantityInput(), { target: { value: '3' } })
    expect(screen.getByRole('alert').textContent).toContain('Estoque insuficiente')
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Confirmar baixa' }).disabled,
    ).toBe(true)
    expect(adjustProductStockMock).not.toHaveBeenCalled()
  })
})

function getQuantityInput() {
  const input = document.querySelector<HTMLInputElement>('[name="quantity"]')
  if (!input) throw new Error('Missing quantity input')
  return input
}

function createProps() {
  const now = new Date()
  return {
    allowNegativeStock: false,
    currentBalance: 10,
    isOpen: true,
    productId: 'product-1',
    type: 'entry' as const,
    unit: 'kg' as const,
    brand: {
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
    },
  }
}
