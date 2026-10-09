import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { OrderConfirmation } from '..'
import { useOrderConfirmation } from '../use-order-confirmation'

vi.mock('../use-order-confirmation', () => ({ useOrderConfirmation: vi.fn() }))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
const useOrderConfirmationMock = vi.mocked(useOrderConfirmation)

describe('OrderConfirmation', () => {
  beforeEach(() =>
    useOrderConfirmationMock.mockReturnValue({
      breakdown: [['Subtotal', 'R$ 20,00']],
      sequence: '0042',
      metadata: [['Canal de venda', 'Sem canal']],
      lines: [{ name: 'Pote pronto', details: 'Unidade · 1 un.', subtotal: 'R$ 20,00' }],
      total: 'R$ 20,00',
      handleNewSale: vi.fn(),
    }),
  )
  afterEach(cleanup)
  it('renders real summary children and the print action alongside existing navigation', () => {
    render(<OrderConfirmation onNewSale={vi.fn()} order={makeOrder()} />)
    expect(screen.getByRole('heading', { name: 'Pedido registrado' })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByText('#0042')).toBeInstanceOf(HTMLElement)
    expect(screen.getByText('Pote pronto')).toBeInstanceOf(HTMLElement)
    expect(screen.getByRole('link', { name: 'Ver pedido' }).getAttribute('href')).toBe(
      ROUTES.orderDetails,
    )
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).hasAttribute('disabled'),
    ).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova venda' }))
    expect(
      useOrderConfirmationMock.mock.results.at(-1)?.value.handleNewSale,
    ).toHaveBeenCalledOnce()
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
