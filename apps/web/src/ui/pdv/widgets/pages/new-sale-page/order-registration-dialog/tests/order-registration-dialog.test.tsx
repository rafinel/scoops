import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OrderRegistrationDialog } from '..'

const cart = {
  establishmentId: 'establishment-1',
  lines: [
    {
      accompanimentIds: [],
      kind: 'resale' as const,
      productId: 'product-1',
      quantity: 2,
      baseUnitPrice: 10,
      finalUnitPrice: 10,
      subtotal: 20,
      consumptions: [],
    },
  ],
  discounts: [],
  subtotal: 20,
  totalDiscount: 0,
  total: 20,
}

describe('OrderRegistrationDialog', () => {
  afterEach(cleanup)

  it('shows the server preview total and confirms registration', () => {
    const onConfirm = vi.fn()
    render(
      <OrderRegistrationDialog
        cart={cart}
        isOpen
        isPending={false}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getAllByText('R$ 20,00')).toHaveLength(2)
    const confirmButton = screen.getByRole('button', { name: 'Confirmar registro' })
    confirmButton.focus()
    expect(document.activeElement).toBe(confirmButton)
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
