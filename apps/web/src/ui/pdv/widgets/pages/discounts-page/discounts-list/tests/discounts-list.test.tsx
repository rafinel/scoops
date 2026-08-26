import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MouseEvent, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DiscountsList } from '..'
import { useDiscountsList } from '../use-discounts-list'

import { makeComboDetails } from '../../tests/discount-test-fixtures'

vi.mock('../use-discounts-list', () => ({ useDiscountsList: vi.fn() }))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({
    children,
    onClick,
  }: {
    children: ReactNode
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  }) => (
    <a href='/discounts/combo-1' onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('DiscountsList', () => {
  afterEach(cleanup)

  it('renders combo composition, status, filters and detail action', () => {
    const details = makeComboDetails()
    vi.mocked(useDiscountsList).mockReturnValue({
      discounts: [details],
      firstItem: 1,
      hasFilters: false,
      lastItem: 1,
      pageCount: 1,
      pageNumber: 1,
      pageSize: 10,
      total: 1,
    })
    const onDetails = vi.fn()
    render(
      <DiscountsList
        hasFilters={false}
        onClearFilters={vi.fn()}
        onDetails={onDetails}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onTypeChange={vi.fn()}
        page={{ items: [details], page: 1, pageSize: 10, total: 1, totalPages: 1 }}
        search={{}}
      />,
    )
    expect(screen.getAllByText('Combo Açaí + Brownie').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2 itens/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('link', { name: 'Detalhes' })[0])
    expect(onDetails).toHaveBeenCalledWith('combo-1')
  })

  it('keeps a filtered empty state recoverable', () => {
    const onClearFilters = vi.fn()
    vi.mocked(useDiscountsList).mockReturnValue({
      discounts: [],
      firstItem: 0,
      hasFilters: true,
      lastItem: 0,
      pageCount: 0,
      pageNumber: 1,
      pageSize: 10,
      total: 0,
    })
    render(
      <DiscountsList
        hasFilters
        onClearFilters={onClearFilters}
        onDetails={vi.fn()}
        onPageChange={vi.fn()}
        onSearchChange={vi.fn()}
        onStatusChange={vi.fn()}
        onTypeChange={vi.fn()}
        page={{ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 }}
        search={{ status: 'inactive' }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it('renders pt-BR filter labels while preserving canonical callback values', () => {
    const details = makeComboDetails()
    vi.mocked(useDiscountsList).mockReturnValue({
      discounts: [details],
      firstItem: 1,
      hasFilters: false,
      lastItem: 1,
      pageCount: 1,
      pageNumber: 1,
      pageSize: 10,
      total: 1,
    })
    const onStatusChange = vi.fn()
    const onTypeChange = vi.fn()
    const props = {
      hasFilters: false,
      onClearFilters: vi.fn(),
      onDetails: vi.fn(),
      onPageChange: vi.fn(),
      onSearchChange: vi.fn(),
      onStatusChange,
      onTypeChange,
      page: { items: [details], page: 1, pageSize: 10, total: 1, totalPages: 1 },
    }
    const { rerender } = render(<DiscountsList {...props} search={{}} />)

    const typeFilter = screen.getByRole('combobox', { name: 'Filtrar por tipo' })
    const statusFilter = screen.getByRole('combobox', {
      name: 'Filtrar por status',
    })
    expect(typeFilter.textContent).toContain('Todos')
    expect(statusFilter.textContent).toContain('Todos')

    fireEvent.click(typeFilter)
    selectOption(screen.getByRole('option', { name: 'Combo' }))
    expect(onTypeChange).toHaveBeenCalledWith('combo')

    fireEvent.click(statusFilter)
    selectOption(screen.getByRole('option', { name: 'Inativo' }))
    expect(onStatusChange).toHaveBeenCalledWith('inactive')

    rerender(<DiscountsList {...props} search={{ status: 'active', type: 'combo' }} />)
    expect(typeFilter.textContent).toContain('Combo')
    expect(statusFilter.textContent).toContain('Ativo')
  })
})

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}
