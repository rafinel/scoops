import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { renderHook, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useOrderPrintDocument } from '../use-order-print-document'

describe('useOrderPrintDocument', () => {
  afterEach(cleanup)
  it('projects saved public facts and prices rather than recomputing financial values', () => {
    const original = makeOrder()
    const order = makeOrder({
      sequenceNumber: 124,
      createdByName: 'Carlo',
      channel: { channelId: 'private-channel', name: 'Delivery', percentage: 12 },
      lines: [
        {
          ...original.lines[0],
          product: {
            productId: 'private-product',
            name: 'Açaí histórico',
            kind: 'portion',
          },
          size: { sizeId: 'private-size', name: 'Médio', quantity: 500 },
          brand: { brandId: 'private-brand', name: 'Marca histórica' },
          accompaniments: [
            {
              accompanimentId: 'private-accompaniment',
              name: 'Leite em pó',
              type: 'portion',
              quantity: 1,
              basePrice: 0,
              finalPrice: 0,
            },
          ],
          quantity: 2,
          finalUnitPrice: 17.92,
          subtotal: 35.84,
          cogsCents: 12345,
        },
      ],
      discounts: [
        {
          discount: {
            discountId: 'private-discount',
            name: 'Combo histórico',
            type: 'combo',
            fixedPrice: 30,
            components: [],
          },
          savings: 3.84,
          lineProductIds: ['private-product'],
        },
      ],
      subtotal: 42.56,
      totalDiscount: 3.84,
      total: 38.72,
    })
    const { result } = renderHook(() => useOrderPrintDocument(order))
    expect(result.current.sequence).toBe('00124')
    expect(result.current.metadata).toContainEqual(['Registrado por', 'Carlo'])
    expect(result.current.metadata).toContainEqual(['Canal', 'Delivery · +12,00%'])
    expect(result.current.lines[0]).toEqual({
      name: 'Açaí histórico',
      configurations: ['Médio', 'Marca histórica', 'Leite em pó · R$\u00a00,00'],
      quantity: '2',
      unitPrice: 'R$ 17,92',
      subtotal: 'R$ 35,84',
    })
    expect(result.current.discounts[0]).toMatchObject({
      name: 'Combo histórico',
      savings: '− R$ 3,84',
    })
    expect(result.current.subtotal).toBe('R$ 20,00')
    expect(result.current.totalDiscount).toBe('− R$ 3,84')
    expect(result.current.total).toBe('R$ 38,72')
    expect(result.current.count).toBe('1 produto · 2 unidades')
    expect(JSON.stringify(result.current)).not.toMatch(
      /private-|cogsCents|consumptions|costComponents|idempotencyKey/,
    )
  })

  it('omits optional facts, uses Sem canal and updates from replacement snapshots', () => {
    const order = makeOrder({ sequenceNumber: 42 })
    const { result, rerender } = renderHook(
      (currentOrder) => useOrderPrintDocument(currentOrder),
      { initialProps: order },
    )
    expect(result.current.metadata).toContainEqual(['Canal', 'Sem canal'])
    expect(result.current.lines[0].configurations).toEqual([])
    expect(result.current.discounts).toEqual([])
    expect(result.current.totalDiscount).toBeNull()
    expect(result.current.cancellation).toBeNull()
    expect(result.current.count).toBe('1 produto · 1 unidade')
    const canceled = makeCanceledOrder({
      ...order,
      sequenceNumber: 54321,
      cancellation: {
        canceledAt: new Date('2026-09-30T16:08:00Z'),
        canceledBy: 'private-actor',
        canceledByName: 'Gerente',
        outcomes: [],
      },
    })
    rerender(canceled)
    expect(result.current.sequence).toBe('54321')
    expect(result.current.metadata).toContainEqual(['Status', 'Cancelado'])
    expect(result.current.cancellation).toEqual({
      date: expect.stringContaining('30/09/2026'),
      actor: 'Gerente',
      reason: undefined,
    })
    rerender({
      ...canceled,
      cancellation: { ...canceled.cancellation!, reason: 'Pedido duplicado' },
    })
    expect(result.current.cancellation?.reason).toBe('Pedido duplicado')
    rerender({
      ...order,
      channel: { channelId: 'id', name: 'Balcão', percentage: -5 },
      lines: [],
    })
    expect(result.current.metadata).toContainEqual(['Canal', 'Balcão · -5,00%'])
    expect(result.current.count).toBe('0 produtos · 0 unidades')
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
