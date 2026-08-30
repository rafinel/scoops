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
vi.mock('../order-items', () => ({ OrderItems: () => <div>items</div> }))
vi.mock('../order-summary', () => ({ OrderSummary: () => <div>summary</div> }))
vi.mock('../cancel-order-dialog', () => ({ CancelOrderDialog: () => null }))
const useOrderDetailsPageMock = vi.mocked(useOrderDetailsPage)

describe('OrderDetailsPage', () => {
  afterEach(cleanup)
  it('renders snapshot detail and Manager cancellation action for Registered orders', () => {
    useOrderDetailsPageMock.mockReturnValue({
      canCancel: true,
      isCancelOpen: false,
      isLoadingOrder: false,
      order: { id: 'order-1', sequenceNumber: 124, status: 'registered' } as never,
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
    expect(screen.getByText('items')).toBeTruthy()
  })
})
