import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OrderPrintDocument } from '..'
import { useOrderPrintDocument } from '../use-order-print-document'

vi.mock('../use-order-print-document', () => ({ useOrderPrintDocument: vi.fn() }))
const useOrderPrintDocumentMock = vi.mocked(useOrderPrintDocument)

describe('OrderPrintDocument', () => {
  beforeEach(() =>
    useOrderPrintDocumentMock.mockReturnValue({
      sequence: '00124',
      metadata: [
        ['Registrado em', '30/09/2026'],
        ['Registrado por', 'Carlo'],
        ['Canal', 'Sem canal'],
        ['Status', 'Registrado'],
      ],
      lines: [
        {
          name: '<script>alert(1)</script>',
          configurations: ['Médio', 'Leite em pó'],
          quantity: '2',
          unitPrice: 'R$ 10,00',
          subtotal: 'R$ 20,00',
        },
      ],
      totals: [
        { label: 'Subtotal dos produtos', value: 'R$ 20,00', isTotal: false },
        { label: 'Total do pedido', value: 'R$ 20,00', isTotal: true },
      ],
      discounts: [],
      subtotal: 'R$ 20,00',
      totalDiscount: null,
      total: 'R$ 20,00',
      cancellation: null,
      count: '1 produto · 2 unidades',
    }),
  )
  afterEach(cleanup)
  it('renders the real item composition, safe text and non-fiscal content', () => {
    const { container } = render(<OrderPrintDocument order={makeOrder()} />)
    expect(
      screen.getByRole('article', { name: 'Cópia não fiscal do pedido #00124' }),
    ).toBeInstanceOf(HTMLElement)
    expect(screen.getByText('<script>alert(1)</script>')).toBeInstanceOf(HTMLElement)
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('Leite em pó')).toBeInstanceOf(HTMLElement)
    expect(screen.getAllByText('Cópia não fiscal')).toHaveLength(2)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Pedido cancelado' })).toBeNull()
    expect(screen.queryByText('Desconto total')).toBeNull()
  })
  it('renders discounts and saved cancellation facts with optional reason', () => {
    useOrderPrintDocumentMock.mockReturnValue({
      ...useOrderPrintDocumentMock.getMockImplementation()!(makeOrder()),
      discounts: [{ key: 0, name: 'Combo', savings: '− R$ 2,00' }],
      totals: [
        { label: 'Combo', value: '− R$ 2,00', isTotal: false },
        { label: 'Desconto total', value: '− R$ 2,00', isTotal: false },
      ],
      totalDiscount: '− R$ 2,00',
      cancellation: { date: '30/09/2026', actor: 'Carlo', reason: 'Pedido duplicado' },
    })
    const { rerender } = render(<OrderPrintDocument order={makeCanceledOrder()} />)
    expect(screen.getByText('Combo')).toBeInstanceOf(HTMLElement)
    expect(
      screen.getByRole('region', { name: 'Pedido cancelado' }).textContent,
    ).toContain('Responsável: Carlo')
    expect(screen.getByText('Motivo: Pedido duplicado')).toBeInstanceOf(HTMLElement)
    useOrderPrintDocumentMock.mockReturnValue({
      ...useOrderPrintDocumentMock.getMockImplementation()!(makeOrder()),
      cancellation: { date: '30/09/2026', actor: 'Carlo', reason: undefined },
    })
    rerender(<OrderPrintDocument order={makeCanceledOrder()} />)
    expect(screen.queryByText(/Motivo:/)).toBeNull()
  })
})

function makeOrder(overrides: Partial<OrderDetails> = {}): OrderDetails {
  return {
    id: 'private-order',
    establishmentId: 'private-establishment',
    idempotencyKey: 'private-key',
    sequenceNumber: 124,
    createdBy: 'private-user',
    createdByName: 'Carlo',
    status: 'registered',
    createdAt: new Date('2026-01-01T12:00:00Z'),
    lines: [
      {
        product: {
          productId: 'private-product',
          name: 'Produto histórico',
          kind: 'resale',
        },
        accompaniments: [],
        quantity: 1,
        baseUnitPrice: 10,
        finalUnitPrice: 10,
        subtotal: 10,
        allocatedNetSalesCents: 1000,
        costComponents: [],
        cogsCents: null,
        consumptions: [],
      },
    ],
    discounts: [],
    subtotal: 10,
    totalDiscount: 0,
    total: 10,
    ...overrides,
  }
}
function makeCanceledOrder(overrides: Partial<OrderDetails> = {}): OrderDetails {
  return makeOrder({
    cancellation: {
      canceledAt: new Date('2026-01-02T12:00:00Z'),
      canceledBy: 'private-manager',
      canceledByName: 'Gerente',
      outcomes: [],
    },
    ...overrides,
    status: 'canceled',
  })
}
