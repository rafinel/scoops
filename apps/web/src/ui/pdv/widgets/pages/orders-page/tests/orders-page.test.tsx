import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OrdersPage } from '..'
import { useOrdersPage } from '../use-orders-page'

vi.mock('../use-orders-page', () => ({ useOrdersPage: vi.fn() }))
vi.mock('../orders-filters', () => ({ OrdersFilters: () => <div>filters</div> }))
vi.mock('../orders-list', () => ({ OrdersList: () => <div>orders-list</div> }))
vi.mock('../orders-loading', () => ({ OrdersLoading: () => <div>loading</div> }))
vi.mock('../orders-empty-state', () => ({ OrdersEmptyState: () => <div>empty</div> }))
vi.mock('../orders-filtered-empty-state', () => ({
  OrdersFilteredEmptyState: () => <div>filtered-empty</div>,
}))
vi.mock('../orders-error', () => ({ OrdersError: () => <div>error</div> }))

const useOrdersPageMock = vi.mocked(useOrdersPage)
const search = {
  search: '',
  channelId: undefined,
  status: undefined,
  period: 'last-30-days' as const,
  page: 1,
}

describe('OrdersPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useOrdersPageMock.mockReturnValue({
      channels: [],
      hasFilters: false,
      isLoadingChannels: false,
      isLoadingOrders: false,
      ordersError: null,
      ordersPage: { items: [], page: 1, pageSize: 6, total: 0, totalPages: 0 },
      refetchOrders: vi.fn(),
      handleClearFilters: vi.fn(),
      handleNewSale: vi.fn(),
      handleOpenOrder: vi.fn(),
      handlePageChange: vi.fn(),
      handleSearchChange: vi.fn(),
      search,
    })
  })

  it('renders the heading and delegates the filters and empty state', () => {
    render(<OrdersPage onSearchChange={vi.fn()} search={search} />)
    expect(screen.getByRole('heading', { name: /Pedidos/ })).toBeTruthy()
    expect(screen.getByText('filters')).toBeTruthy()
    expect(screen.getByText('empty')).toBeTruthy()
  })
})
