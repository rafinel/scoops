import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OrdersList } from '..'

vi.mock('../use-orders-list', () => ({
  useOrdersList: () => ({
    formatOrderDate: () => '25/07/2026 16:24',
    formatOrderTotal: () => 'R$ 42,56',
  }),
}))

describe('OrdersList', () => {
  afterEach(cleanup)
  it('renders operator, channel, status, total and an accessible detail action', () => {
    render(
      <OrdersList
        onOpenOrder={vi.fn()}
        onPageChange={vi.fn()}
        ordersPage={{
          page: 1,
          pageSize: 6,
          total: 1,
          items: [
            {
              id: 'order-1',
              establishmentId: 'establishment-1',
              idempotencyKey: 'key-1',
              sequenceNumber: 124,
              createdBy: 'user-1',
              createdByName: 'Carlo — Gerente',
              status: 'registered',
              lines: [
                {
                  product: { productId: 'product-1', name: 'Açaí', kind: 'portion' },
                  accompaniments: [],
                  quantity: 1,
                  baseUnitPrice: 16,
                  finalUnitPrice: 16,
                  subtotal: 16,
                  consumptions: [],
                },
              ],
              discounts: [],
              subtotal: 16,
              totalDiscount: 0,
              total: 16,
              createdAt: new Date('2026-07-25T16:24:00.000Z'),
            },
          ],
        }}
      />,
    )
    expect(screen.getAllByText('Carlo — Gerente')).not.toHaveLength(0)
    expect(screen.getAllByText('Registrado').length).toBeGreaterThan(0)
    expect(screen.getByRole('columnheader', { name: 'AÇÃO' })).toBeTruthy()
    expect(screen.getByText('Detalhes')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver pedido 124' })).toBeTruthy()
  })
})
