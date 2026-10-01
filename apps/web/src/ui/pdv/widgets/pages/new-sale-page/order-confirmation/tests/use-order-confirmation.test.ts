import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cleanup, renderHook, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useOrderConfirmation } from '../use-order-confirmation'

describe('useOrderConfirmation', () => {
  afterEach(cleanup)
  it('preserves saved metadata, four-digit identity, lines, totals and new-sale callback', () => {
    const order = makeOrder({ sequenceNumber: 42 })
    const onNewSale = vi.fn()
    const { result, rerender } = renderHook((props) => useOrderConfirmation(props), {
      initialProps: { order, onNewSale },
    })
    expect(result.current.sequence).toBe('0042')
    expect(result.current.metadata).toContainEqual(['Canal de venda', 'Sem canal'])
    expect(result.current.metadata).toContainEqual(['Quantidade', '1 itens'])
    expect(result.current.metadata[0][1]).toContain('2026')
    expect(result.current.lines[0]).toMatchObject({
      details: 'Unidade · 1 un.',
      subtotal: 'R$ 10,00',
    })
    expect(result.current.total).toBe('R$ 10,00')
    act(() => result.current.handleNewSale())
    expect(onNewSale).toHaveBeenCalledOnce()
    rerender({
      order: {
        ...order,
        channel: { channelId: 'id', name: 'Delivery', percentage: 12 },
        lines: [
          { ...order.lines[0], size: { sizeId: 'id', name: '500 ml', quantity: 500 } },
        ],
      },
      onNewSale,
    })
    expect(result.current.metadata).toContainEqual(['Canal de venda', 'Delivery · +12%'])
    expect(result.current.lines[0].details).toBe('500 ml · 1 un.')
    rerender({
      order: {
        ...order,
        channel: { channelId: 'id', name: 'Balcão', percentage: -5 },
        lines: [{ ...order.lines[0], brand: { brandId: 'id', name: 'Marca' } }],
      },
      onNewSale,
    })
    expect(result.current.metadata).toContainEqual(['Canal de venda', 'Balcão · -5%'])
    expect(result.current.lines[0].details).toBe('Marca · 1 un.')
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
