import { useState } from 'react'

import type {
  SaleItemKind,
  SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

import { useOrderCatalogQuery } from '@/ui/pdv/hooks/use-order-catalog-query'

export type UseNewSaleCatalogProps = {
  onSelectProduct: (product: SalesCatalogProduct) => void
}

export function useNewSaleCatalog({ onSelectProduct }: UseNewSaleCatalogProps) {
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<SaleItemKind>()
  const [page, setPage] = useState(1)
  const { catalogError, catalogPage, isCatalogError, isLoadingCatalog, refetchCatalog } =
    useOrderCatalogQuery(search, kind, page)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleKindChange(value: SaleItemKind | undefined) {
    setKind(value)
    setPage(1)
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
  }

  function handleSelectProduct(product: SalesCatalogProduct) {
    if (!product.isAvailable) return
    onSelectProduct(product)
  }

  function handleClearFilters() {
    setSearch('')
    setKind(undefined)
    setPage(1)
  }

  return {
    catalogError,
    catalogPage,
    handleClearFilters,
    handleKindChange,
    handlePageChange,
    handleSearchChange,
    handleSelectProduct,
    isCatalogError,
    isLoadingCatalog,
    kind,
    page,
    refetchCatalog,
    search,
  }
}
