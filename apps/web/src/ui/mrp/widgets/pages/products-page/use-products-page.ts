import { useState } from 'react'

import { type ProductsSearch, useProductsQuery } from '../../../hooks/use-products-query'

export type ProductsPageHookProps = {
  search: ProductsSearch
  onSearchChange: (search: ProductsSearch) => void
}

export function useProductsPage({ search, onSearchChange }: ProductsPageHookProps) {
  const query = useProductsQuery(search)
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [isRegisterOpen, setRegisterOpen] = useState(false)

  function handleSearch(value: string) {
    onSearchChange({ ...search, search: value, page: 1 })
  }

  function handleEmptyStateClear() {
    onSearchChange({
      ...search,
      search: '',
      categories: [],
      status: undefined,
      stockSituation: undefined,
      page: 1,
    })
  }

  function handleOpenFilter() {
    setFilterOpen(true)
  }

  function handleFilterOpenChange(open: boolean) {
    setFilterOpen(open)
  }

  function handleRegisterOpenChange(open: boolean) {
    setRegisterOpen(open)
  }

  return {
    handleEmptyStateClear,
    handleFilterOpenChange,
    handleOpenFilter,
    handleRegisterOpenChange,
    handleSearch,
    isFilterOpen,
    isRegisterOpen,
    query,
  }
}

export type { ProductsSearch }
