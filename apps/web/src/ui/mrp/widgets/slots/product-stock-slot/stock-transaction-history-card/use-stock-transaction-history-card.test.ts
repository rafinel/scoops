import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useStockTransactionsQuery } from '../../../../hooks/use-stock-transactions-query'

import { useStockTransactionHistoryCard } from './use-stock-transaction-history-card'

vi.mock('../../../../hooks/use-stock-transactions-query', () => ({
  useStockTransactionsQuery: vi.fn(),
}))

const useStockTransactionsQueryMock = vi.mocked(useStockTransactionsQuery)

describe('useStockTransactionHistoryCard', () => {
  it('retains sale-cancellation as a canonical filter and resets its page', () => {
    useStockTransactionsQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const { result } = renderHook(() => useStockTransactionHistoryCard('product-1', []))
    act(() => result.current.handleTypeChange('sale-cancellation'))
    expect(useStockTransactionsQueryMock).toHaveBeenLastCalledWith(
      'product-1',
      expect.objectContaining({ page: 1, type: 'sale-cancellation' }),
    )
  })
})
