import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StockTransactionHistoryCard } from '.'

import { useStockTransactionsQuery } from '../../../../hooks/use-stock-transactions-query'

vi.mock('../../../../hooks/use-stock-transactions-query', () => ({
  useStockTransactionsQuery: vi.fn(),
}))

const useStockTransactionsQueryMock = vi.mocked(useStockTransactionsQuery)
const refetchMock = vi.fn()

describe('StockTransactionHistoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStockTransactionsQueryMock.mockReturnValue(fakeStockTransactionsQuery())
  })

  afterEach(cleanup)

  it('renders signed immutable snapshots and passes exact filters to its query hook', async () => {
    renderHistory()

    expect(await screen.findAllByText('Gestora Ágil')).toHaveLength(2)
    expect(screen.getAllByText('+3 kg')).toHaveLength(2)
    expect(screen.getAllByText('Marca removida')).toHaveLength(2)

    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }))
    selectOption(await screen.findByRole('option', { name: 'Baixa Manual' }))
    fireEvent.click(screen.getByRole('combobox', { name: 'Marca' }))
    selectOption(await screen.findByRole('option', { name: 'Frooty' }))
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-08-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-08-18' } })

    await waitFor(() =>
      expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith(
        'product-1',
        expect.objectContaining({
          page: 1,
          limit: 5,
          type: 'write-off',
          brandId: 'brand-1',
        }),
      ),
    )
    const input = useStockTransactionsQueryMock.mock.calls.at(-1)?.[1]
    expect(input?.from).toEqual(new Date('2026-08-01T00:00:00.000'))
    expect(input?.to).toEqual(new Date('2026-08-18T23:59:59.999'))

    fireEvent.click(screen.getByRole('button', { name: /Limpar filtros/ }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Limpar filtros/ })).toBeNull(),
    )
  })

  it('renders loading and request-recovery states from its query hook', () => {
    useStockTransactionsQueryMock.mockReturnValue(
      fakeStockTransactionsQuery({ data: undefined, isPending: true }),
    )
    const { rerender } = renderHistory()

    expect(screen.getByRole('status').textContent).toContain('Carregando histórico')

    useStockTransactionsQueryMock.mockReturnValue(
      fakeStockTransactionsQuery({ data: undefined, isError: true }),
    )
    rerender(<StockTransactionHistoryCard brands={[fakeBrand()]} productId='product-1' />)

    expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetchMock).toHaveBeenCalledOnce()
  })

  it('distinguishes an empty history without filters', () => {
    useStockTransactionsQueryMock.mockReturnValue(
      fakeStockTransactionsQuery({
        data: { items: [], page: 1, limit: 5, total: 0 },
      }),
    )
    renderHistory()

    expect(screen.getByText('Nenhuma movimentação registrada.')).not.toBeNull()
  })
})

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}

function renderHistory() {
  return render(
    <StockTransactionHistoryCard brands={[fakeBrand()]} productId='product-1' />,
  )
}

function fakeStockTransactionsQuery(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof useStockTransactionsQuery> {
  return {
    data: {
      items: [
        {
          id: 'transaction-1',
          establishmentId: 'establishment-1',
          productId: 'product-1',
          brandId: 'deleted-brand',
          productName: 'Polpa',
          brandName: 'Marca removida',
          unit: 'kg',
          type: 'entry',
          quantity: 3,
          balanceAfter: 13,
          performedBy: 'user-1',
          performedByName: 'Gestora Ágil',
          occurredAt: new Date('2026-08-18T12:00:00.000Z'),
        },
      ],
      page: 1,
      limit: 5,
      total: 1,
    },
    isError: false,
    isPending: false,
    refetch: refetchMock,
    ...overrides,
  } as unknown as ReturnType<typeof useStockTransactionsQuery>
}

function fakeBrand() {
  const now = new Date('2026-08-22T12:00:00.000Z')
  return {
    brand: {
      id: 'brand-1',
      productId: 'product-1',
      name: 'Frooty',
      packageQuantity: 2,
      packagePrice: 8,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
    stockQuantity: 10,
    unitPrice: 4,
  }
}
