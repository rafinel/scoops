import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

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
vi.mock('../cancel-order-dialog', () => ({
  CancelOrderDialog: (_props: import('../cancel-order-dialog').CancelOrderDialogProps) =>
    null,
}))
const useOrderDetailsPageMock = vi.mocked(useOrderDetailsPage)

const makeLine = (productId: string, name: string) => ({
  product: { productId, name, kind: 'portion' as const },
  quantity: 1,
  accompaniments: [],
  baseUnitPrice: 42.56,
  finalUnitPrice: 42.56,
  subtotal: 42.56,
  allocatedNetSalesCents: 4256,
  costComponents: [],
  cogsCents: null,
  consumptions: [],
})

describe('OrderDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: false,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: makeOrder(),
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    })
  })
  afterEach(cleanup)
  it('renders snapshot detail and Manager cancellation action for Registered orders', () => {
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: true,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: {
        ...makeOrder(),
        id: 'order-1',
        sequenceNumber: 124,
        status: 'registered',
        lines: [makeLine('product-1', 'Açaí tradicional')],
      } satisfies OrderDetails,
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    })
    render(<OrderDetailsPage orderId='order-1' />)
    expect(screen.getAllByRole('heading', { name: 'Pedido #00124' })[0]).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByRole('link', { name: 'Voltar para pedidos' })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByRole('button', { name: /Cancelar pedido/ })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getAllByText('Açaí tradicional')[0]).toBeInstanceOf(HTMLElement)
  })

  it('offers printing to Operator for both statuses and guards refresh, loading and errors', () => {
    const baseline = useOrderDetailsPageMock.mock.results.at(-1)?.value ?? {
      canCancel: false,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: makeOrder(),
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    }
    const { rerender } = render(<OrderDetailsPage orderId='order-1' />)
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).hasAttribute('disabled'),
    ).toBe(false)
    expect(screen.queryByRole('button', { name: /Cancelar pedido/ })).toBeNull()
    useOrderDetailsPageMock.mockReturnValue({
      ...baseline,
      order: makeCanceledOrder(),
      isRefreshingOrder: true,
    })
    rerender(<OrderDetailsPage orderId='order-1' />)
    expect(
      screen.getByRole('button', { name: 'Imprimir pedido' }).hasAttribute('disabled'),
    ).toBe(true)
    useOrderDetailsPageMock.mockReturnValue({
      ...baseline,
      isLoadingOrder: true,
      order: undefined,
    })
    rerender(<OrderDetailsPage orderId='order-1' />)
    expect(screen.queryByRole('button', { name: 'Imprimir pedido' })).toBeNull()
    expect(screen.queryByRole('article')).toBeNull()
    useOrderDetailsPageMock.mockReturnValue({ ...baseline, order: undefined })
    rerender(<OrderDetailsPage orderId='order-1' />)
    expect(screen.queryByRole('button', { name: 'Imprimir pedido' })).toBeNull()
  })

  it('shows returned and lost outcomes by line while hiding skipped outcomes', () => {
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: false,
      isCancelOpen: false,
      isLoadingOrder: false,
      isRefreshingOrder: false,
      order: {
        ...makeOrder(),
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
      } satisfies OrderDetails,
      orderError: null,
      handleBack: vi.fn(),
      handleCancelOpenChange: vi.fn(),
      handleOpenCancel: vi.fn(),
      handleRetry: vi.fn(),
    })

    render(<OrderDetailsPage orderId='order-1' />)

    expect(screen.getAllByText('Açaí tradicional')[0]).toBeInstanceOf(HTMLElement)
    expect(screen.getByText('Devolvido ao estoque')).toBeInstanceOf(HTMLElement)
    expect(screen.getByText('Registrado como perda')).toBeInstanceOf(HTMLElement)
    expect(screen.queryByText('Destino ignorado')).toBeNull()
    expect(
      screen
        .getAllByRole('group', { name: 'Destino do estoque' })[2]
        ?.querySelector('span'),
    ).toBeNull()
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
