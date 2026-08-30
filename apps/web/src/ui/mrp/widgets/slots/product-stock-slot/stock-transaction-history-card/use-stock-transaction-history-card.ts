import { useState } from 'react'

import type {
  ProductBrandStock,
  StockTransactionType,
} from '@scoops/core/mrp/domain/structures'

import { useStockTransactionsQuery } from '../../../../hooks/use-stock-transactions-query'

const PAGE_SIZE = 5

export function useStockTransactionHistoryCard(
  productId: string,
  brands: readonly ProductBrandStock[],
) {
  const [type, setType] = useState<StockTransactionType | ''>('')
  const [brandId, setBrandId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const transactionsQuery = useStockTransactionsQuery(productId, {
    page,
    limit: PAGE_SIZE,
    type: type || undefined,
    brandId: brandId || undefined,
    from: from ? new Date(`${from}T00:00:00.000`) : undefined,
    to: to ? new Date(`${to}T23:59:59.999`) : undefined,
  })
  const hasFilters = Boolean(type || brandId || from || to)
  const selectedBrandName = brands.find(({ brand }) => brand.id === brandId)?.brand.name

  function handleFilterChange(callback: () => void) {
    callback()
    setPage(1)
  }

  function handleTypeChange(value: string | null) {
    handleFilterChange(() =>
      setType(value === 'all' || value === null ? '' : (value as StockTransactionType)),
    )
  }

  function handleBrandChange(value: string | null) {
    handleFilterChange(() => setBrandId(value === 'all' || value === null ? '' : value))
  }

  function handleFromChange(value: string) {
    handleFilterChange(() => setFrom(value))
  }

  function handleToChange(value: string) {
    handleFilterChange(() => setTo(value))
  }

  function handleClearFilters() {
    setType('')
    setBrandId('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
  }

  return {
    brandId,
    from,
    handleBrandChange,
    handleClearFilters,
    handleFromChange,
    handlePageChange,
    handleToChange,
    handleTypeChange,
    hasFilters,
    isError: transactionsQuery.isError,
    isLoading: transactionsQuery.isPending,
    refetch: transactionsQuery.refetch,
    selectedBrandName,
    to,
    transactionsPage: transactionsQuery.data,
    type,
  }
}
