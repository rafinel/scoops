import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BrandFaker,
  StockTransactionFaker,
} from '@scoops/core/mrp/domain/entities/fakers'
import { StockTransactionHistoryCard } from '..'
import { useStockTransactionHistoryCard } from '../use-stock-transaction-history-card'

vi.mock('../use-stock-transaction-history-card', () => ({
  useStockTransactionHistoryCard: vi.fn(),
}))

const useStockTransactionHistoryCardMock = vi.mocked(useStockTransactionHistoryCard)
const refetchMock = vi.fn()
const clearFiltersMock = vi.fn()

describe('StockTransactionHistoryCard', () => {
  const transaction = StockTransactionFaker.fake({
    id: 'transaction-1',
    establishmentId: 'establishment-1',
    productId: 'product-1',
    brandId: 'brand-1',
    productName: 'Polpa',
    brandName: 'Frooty',
    unit: 'kg',
    type: 'entry',
    quantity: 3,
    balanceAfter: 13,
    justification: 'Reposição semanal',
    performedBy: 'user-1',
    performedByName: 'Gestora Ágil',
    occurredAt: new Date('2026-08-18T12:00:00.000Z'),
  })

  function renderHistory() {
    return render(
      <StockTransactionHistoryCard brands={[fakeBrand()]} productId='product-1' />,
    )
  }

  function createState(
    overrides: Partial<ReturnType<typeof useStockTransactionHistoryCard>> = {},
  ): ReturnType<typeof useStockTransactionHistoryCard> {
    return {
      brandId: '',
      from: '',
      handleBrandChange: vi.fn(),
      handleClearFilters: clearFiltersMock,
      handleFromChange: vi.fn(),
      handlePageChange: vi.fn(),
      handleToChange: vi.fn(),
      handleTypeChange: vi.fn(),
      hasFilters: false,
      isError: false,
      isLoading: false,
      refetch: refetchMock,
      selectedBrandName: undefined,
      to: '',
      transactionsPage: { items: [transaction], page: 1, limit: 5, total: 1 },
      type: '',
      ...overrides,
    }
  }

  function fakeBrand() {
    return {
      brand: BrandFaker.fake({
        id: 'brand-1',
        productId: 'product-1',
        name: 'Frooty',
        packageQuantity: 2,
        packagePrice: 8,
        isPrimary: true,
      }),
      stockQuantity: 10,
      unitPrice: 4,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useStockTransactionHistoryCardMock.mockReturnValue(createState())
  })

  afterEach(cleanup)

  it('renders attribution and opens the optional justification in a dialog', () => {
    renderHistory()

    expect(screen.getAllByText('Gestora Ágil')).toHaveLength(2)
    expect(screen.getAllByText('Frooty')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Ver justificativa' })[0])

    expect(screen.getByRole('dialog', { name: 'Justificativa' })).not.toBeNull()
    expect(
      (screen.getByRole('textbox', { name: 'Justificativa' }) as HTMLTextAreaElement)
        .value,
    ).toBe('Reposição semanal')
  })

  it('renders loading, error recovery and filtered empty states', () => {
    useStockTransactionHistoryCardMock.mockReturnValue(
      createState({ isLoading: true, transactionsPage: undefined }),
    )
    const { rerender } = renderHistory()
    expect(screen.getByRole('status').textContent).toContain('Carregando histórico')

    useStockTransactionHistoryCardMock.mockReturnValue(
      createState({ isLoading: false, isError: true, transactionsPage: undefined }),
    )
    rerender(<StockTransactionHistoryCard brands={[fakeBrand()]} productId='product-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetchMock).toHaveBeenCalledOnce()

    useStockTransactionHistoryCardMock.mockReturnValue(
      createState({
        hasFilters: true,
        isError: false,
        transactionsPage: { items: [], page: 1, limit: 5, total: 0 },
      }),
    )
    rerender(<StockTransactionHistoryCard brands={[fakeBrand()]} productId='product-1' />)
    expect(
      screen.getByText('Nenhuma movimentação corresponde aos filtros.'),
    ).not.toBeNull()
  })

  it('delegates clear filters from the accessible action', () => {
    useStockTransactionHistoryCardMock.mockReturnValue(
      createState({ hasFilters: true, handleClearFilters: clearFiltersMock }),
    )
    renderHistory()
    fireEvent.click(screen.getByRole('button', { name: /Limpar filtros/ }))
    expect(clearFiltersMock).toHaveBeenCalledOnce()
  })
})
