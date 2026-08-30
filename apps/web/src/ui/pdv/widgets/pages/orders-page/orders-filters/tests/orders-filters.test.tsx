import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OrdersFilters } from '..'
import { useOrdersFilters } from '../use-orders-filters'

vi.mock('../use-orders-filters', () => ({ useOrdersFilters: vi.fn() }))
const useOrdersFiltersMock = vi.mocked(useOrdersFilters)

describe('OrdersFilters', () => {
  afterEach(cleanup)
  it('renders Portuguese controls and preserves the URL-facing values', () => {
    useOrdersFiltersMock.mockReturnValue({
      handleChannelChange: vi.fn(),
      handleFromChange: vi.fn(),
      handlePeriodChange: vi.fn(),
      handleStatusChange: vi.fn(),
      handleToChange: vi.fn(),
      searchValue: '',
      setSearchValue: vi.fn(),
    })
    render(
      <OrdersFilters
        channels={[]}
        isLoadingChannels={false}
        onClear={vi.fn()}
        onSearchChange={vi.fn()}
        search={{
          search: '',
          channelId: undefined,
          status: undefined,
          period: 'last-30-days',
          page: 1,
        }}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Buscar pedidos' })).toBeTruthy()
    expect(
      screen.getByRole('combobox', { name: 'Filtrar por canal' }).textContent,
    ).toContain('Todos os canais')
    expect(
      screen.getByRole('combobox', { name: 'Filtrar por status' }).textContent,
    ).toContain('Todos os status')
  })
})
