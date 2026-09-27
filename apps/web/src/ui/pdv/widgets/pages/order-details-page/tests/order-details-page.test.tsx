import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { OrderDetailsPage } from '..'
import { useOrderDetailsPage } from '../use-order-details-page'

vi.mock('../use-order-details-page', () => ({ useOrderDetailsPage: vi.fn() }))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/ui/shared/hooks/use-format-currency', () => ({
  useFormatCurrency: () => () => 'R$ 42,56',
}))
vi.mock('../order-summary', () => ({ OrderSummary: () => <div>summary</div> }))
vi.mock('../cancel-order-dialog', () => ({ CancelOrderDialog: () => null }))
const useOrderDetailsPageMock = vi.mocked(useOrderDetailsPage)

const makeLine = (productId: string, name: string) => ({
  product: { productId, name, kind: 'portion' },
  quantity: 1,
  accompaniments: [],
  baseUnitPrice: 42.56,
  finalUnitPrice: 42.56,
  subtotal: 42.56,
})

describe('OrderDetailsPage', () => {
  afterEach(cleanup)
  it('renders snapshot detail and Manager cancellation action for Registered orders', () => {
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: true,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: {
        id: 'order-1',
        sequenceNumber: 124,
        status: 'registered',
        lines: [makeLine('product-1', 'Açaí tradicional')],
      } as never,
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    })
    render(<OrderDetailsPage orderId='order-1' />)
    expect(screen.getByRole('heading', { name: 'Pedido #00124' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voltar para pedidos' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancelar pedido/ })).toBeTruthy()
    expect(screen.getByText('Açaí tradicional')).toBeTruthy()
  })

  it('shows returned and lost outcomes by line while hiding skipped outcomes', () => {
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: false,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: {
        id: 'order-1',
        sequenceNumber: 124,
        status: 'canceled',
        lines: [
          makeLine('product-1', 'Açaí tradicional'),
          makeLine('product-2', 'Água mineral'),
          makeLine('product-3', 'Picolé'),
        ],
        cancellation: {
          canceledAt: new Date('2026-07-24T15:42:00.000Z'),
          canceledBy: 'manager-1',
          canceledByName: 'Gerente',
          outcomes: [
            {
              linePosition: 0,
              productId: 'product-1',
              productName: 'Açaí tradicional',
              quantity: 1,
              outcome: 'restored',
            },
            {
              linePosition: 1,
              productId: 'product-2',
              productName: 'Água mineral',
              quantity: 1,
              outcome: 'lost',
            },
            {
              linePosition: 2,
              productId: 'product-3',
              productName: 'Picolé',
              quantity: 1,
              outcome: 'skipped',
            },
          ],
        },
      } as never,
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    })

    render(<OrderDetailsPage orderId='order-1' />)

    expect(screen.getByText('Açaí tradicional')).toBeTruthy()
    expect(screen.getByText('Devolvido ao estoque')).toBeTruthy()
    expect(screen.getByText('Registrado como perda')).toBeTruthy()
    expect(screen.queryByText('Destino ignorado')).toBeNull()
    expect(
      screen
        .getAllByRole('group', { name: 'Destino do estoque' })[2]
        ?.querySelector('span'),
    ).toBeNull()
  })
})
