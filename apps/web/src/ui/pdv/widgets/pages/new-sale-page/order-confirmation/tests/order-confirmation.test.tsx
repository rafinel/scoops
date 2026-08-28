import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OrderConfirmation } from '..'

const order = {
  id: 'order-1',
  establishmentId: 'establishment-1',
  sequenceNumber: 42,
  createdAt: new Date('2026-08-27T12:00:00.000Z'),
  channel: undefined,
  lines: [
    {
      product: { productId: 'product-1', name: 'Pote pronto' },
      brand: undefined,
      size: undefined,
      quantity: 1,
      subtotal: 20,
    },
  ],
  discounts: [],
  subtotal: 20,
  totalDiscount: 0,
  total: 20,
}

describe('OrderConfirmation', () => {
  afterEach(cleanup)

  it('renders the immutable order summary and starts a new sale', () => {
    const onNewSale = vi.fn()
    render(<OrderConfirmation onNewSale={onNewSale} order={order as never} />)

    expect(screen.getByRole('heading', { name: 'Pedido registrado' })).toBeTruthy()
    expect(screen.getByText('#0042')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova venda' }))
    expect(onNewSale).toHaveBeenCalledOnce()
  })
})
