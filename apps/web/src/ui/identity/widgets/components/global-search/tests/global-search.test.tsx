import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { GlobalSearchResults } from '@scoops/core/identity/domain/structures'

import { GlobalSearch } from '..'
import { useGlobalSearch } from '../use-global-search'

vi.mock('../use-global-search', () => ({ useGlobalSearch: vi.fn() }))

const useGlobalSearchMock = vi.mocked(useGlobalSearch)

const pageHit = { kind: 'page', pageKey: 'orders', label: 'Pedidos' } as const
const orderHit = {
  kind: 'order',
  orderId: 'order-1',
  label: '#1042',
  context: 'Ana Silva',
  status: 'registered',
} as const
const results: GlobalSearchResults = {
  pages: [pageHit],
  products: [],
  orders: [orderHit],
  users: [],
  salesChannels: [],
  discounts: [],
}

function createView(overrides: Record<string, unknown> = {}) {
  return {
    activeIndex: -1,
    debouncedQuery: 'pedido',
    flattenedHits: [pageHit, orderHit],
    groups: [
      { key: 'pages', label: 'Páginas', hits: results.pages },
      { key: 'orders', label: 'Pedidos', hits: results.orders },
    ],
    input: 'pedido',
    inputRef: { current: null },
    isEmpty: false,
    isError: false,
    isLoading: false,
    isOpen: true,
    resultCount: 2,
    handleChange: vi.fn(),
    handleKeyDown: vi.fn(),
    handleNavigate: vi.fn(),
    handleRetry: vi.fn(),
    ...overrides,
  }
}

describe('GlobalSearch', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders grouped page and record options with accessible names and context', () => {
    useGlobalSearchMock.mockReturnValue(createView() as never)
    render(<GlobalSearch />)

    expect(screen.getByRole('combobox', { name: 'Buscar no Scoops' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Páginas' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Pedidos' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Página: Pedidos' })).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Pedido: #1042, Ana Silva · Registrado' }),
    ).toBeTruthy()
  })

  it('labels pending users as invitees in the result context', () => {
    const pendingUser = {
      kind: 'user',
      userId: 'user-pending',
      label: 'Marina Costa',
      context: 'marina@example.com',
      status: 'pending',
    } as const
    useGlobalSearchMock.mockReturnValue(
      createView({
        flattenedHits: [pendingUser],
        groups: [{ key: 'users', label: 'Pessoas', hits: [pendingUser] }],
        resultCount: 1,
      }) as never,
    )

    render(<GlobalSearch />)

    expect(
      screen.getByRole('option', {
        name: 'Usuário: Marina Costa, marina@example.com · Convite pendente',
      }),
    ).toBeTruthy()
  })

  it('shows a strong selected treatment on the active result', () => {
    useGlobalSearchMock.mockReturnValue(createView({ activeIndex: 0 }) as never)
    render(<GlobalSearch />)

    const selectedOption = screen.getByRole('option', { name: 'Página: Pedidos' })
    const iconTile = selectedOption.querySelector('[data-search-result-icon]')

    expect(selectedOption.getAttribute('aria-selected')).toBe('true')
    expect(selectedOption.classList.contains('aria-selected:ring-2')).toBe(true)
    expect(selectedOption.classList.contains('aria-selected:ring-primary')).toBe(true)
    expect(iconTile?.classList.contains('bg-card')).toBe(true)
  })

  it('renders loading, empty and retryable error states', () => {
    useGlobalSearchMock.mockReturnValue(createView({ isLoading: true }) as never)
    const { rerender } = render(<GlobalSearch />)
    expect(
      screen
        .getByRole('status', { name: 'Buscando resultados' })
        .classList.contains('min-h-28'),
    ).toBe(true)

    useGlobalSearchMock.mockReturnValue(
      createView({ isLoading: false, isEmpty: true }) as never,
    )
    rerender(<GlobalSearch />)
    const emptyState = screen.getByRole('listbox').querySelector('[role="status"]')
    expect(emptyState?.textContent).toContain('Nenhum resultado para “pedido”')
    expect(emptyState?.classList.contains('min-h-28')).toBe(true)

    const handleRetry = vi.fn()
    useGlobalSearchMock.mockReturnValue(
      createView({ isLoading: false, isError: true, handleRetry }) as never,
    )
    rerender(<GlobalSearch />)
    const errorState = screen.getByRole('alert')
    expect(errorState.classList.contains('min-h-28')).toBe(true)
    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' })
    expect(retryButton.classList.contains('border-0')).toBe(true)
    fireEvent.click(retryButton)
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('forwards input and keyboard events to the owning widget hook', () => {
    const view = createView()
    useGlobalSearchMock.mockReturnValue(view as never)
    render(<GlobalSearch />)
    const input = screen.getByRole('combobox', { name: 'Buscar no Scoops' })
    fireEvent.change(input, { target: { value: 'pedidos' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(view.handleChange).toHaveBeenCalledWith('pedidos')
    expect(view.handleKeyDown).toHaveBeenCalled()
  })
})
