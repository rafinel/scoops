import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CancelOrderDialog } from '..'
import { useCancelOrderDialog } from '../use-cancel-order-dialog'

vi.mock('../use-cancel-order-dialog', () => ({ useCancelOrderDialog: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-format-currency', () => ({
  useFormatCurrency: () => () => 'R$ 42,56',
}))
vi.mock('@/ui/shared/hooks/use-format-date', () => ({
  useFormatDate: () => () => '24/07/2026 15:42',
}))
const useCancelOrderDialogMock = vi.mocked(useCancelOrderDialog)

describe('CancelOrderDialog', () => {
  afterEach(cleanup)
  it('renders the two-column destructive header and optional reason field', () => {
    useCancelOrderDialogMock.mockReturnValue({
      cancelOrderError: null,
      errorMessage: null,
      fieldError: undefined,
      handleClose: vi.fn(),
      handleSubmit: vi.fn(),
      isCancelingOrder: false,
      register: vi.fn((name: string) => ({
        name,
        onBlur: vi.fn(),
        onChange: vi.fn(),
        ref: vi.fn(),
      })) as never,
      watch: vi.fn(() => 'return') as never,
    })
    render(
      <CancelOrderDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        order={
          {
            id: 'order-1',
            sequenceNumber: 124,
            createdAt: new Date(),
            total: 42.56,
            lines: [
              {
                product: { productId: 'product-1', name: 'Açaí', kind: 'portion' },
                quantity: 1,
                accompaniments: [],
                baseUnitPrice: 42.56,
                finalUnitPrice: 42.56,
                subtotal: 42.56,
              },
            ],
          } as never
        }
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Cancelar pedido?' })).toBeTruthy()
    expect(screen.getByLabelText('Motivo do cancelamento (opcional)')).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Devolver ao estoque' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Registrar como perda' })).toBeTruthy()
    expect(
      (screen.getByRole('radio', { name: 'Devolver ao estoque' }) as HTMLInputElement)
        .checked,
    ).toBe(true)
    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeTruthy()
  })
})
