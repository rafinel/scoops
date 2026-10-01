import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OrderPrint } from '..'
import { useOrderPrint } from '../use-order-print'

vi.mock('../use-order-print', () => ({ useOrderPrint: vi.fn() }))
const useOrderPrintMock = vi.mocked(useOrderPrint)

describe('OrderPrint', () => {
  beforeEach(() =>
    useOrderPrintMock.mockReturnValue({
      portalTarget: document.body,
      isPrinting: false,
      isDisabled: false,
      handlePrint: vi.fn(),
    }),
  )
  afterEach(cleanup)
  it('renders a labeled action and real body-level print composition, then removes it', () => {
    const { unmount } = render(<OrderPrint order={makeOrder({ sequenceNumber: 124 })} />)
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).hasAttribute('disabled'),
    ).toBe(false)
    expect(
      screen.getByRole('article', { name: 'Cópia não fiscal do pedido #00124' })
        .parentElement,
    ).toBe(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir pedido' }))
    expect(
      useOrderPrintMock.mock.results.at(-1)?.value.handlePrint,
    ).toHaveBeenCalledOnce()
    unmount()
    expect(screen.queryByRole('article')).toBeNull()
  })
  it('does not expose a document before client readiness and disables pending actions', () => {
    useOrderPrintMock.mockReturnValue({
      portalTarget: null,
      isPrinting: false,
      isDisabled: true,
      handlePrint: vi.fn(),
    })
    const { rerender } = render(<OrderPrint disabled order={makeOrder()} />)
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.queryByRole('article')).toBeNull()
    expect(useOrderPrintMock).toHaveBeenLastCalledWith(true)
    useOrderPrintMock.mockReturnValue({
      portalTarget: document.body,
      isPrinting: true,
      isDisabled: true,
      handlePrint: vi.fn(),
    })
    rerender(<OrderPrint order={makeCanceledOrder()} />)
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).getAttribute('aria-busy'),
    ).toBe('true')
    expect(screen.getByRole('region', { name: 'Pedido cancelado' })).toBeInstanceOf(
      HTMLElement,
    )
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
