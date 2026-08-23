import { useState } from 'react'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { type ProductsSearch, useProductsQuery } from '@/ui/mrp/hooks/use-products-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export type ProductsPageHookProps = {
  search: ProductsSearch
  onSearchChange: (search: ProductsSearch) => void
}

export function useProductsPage({ search, onSearchChange }: ProductsPageHookProps) {
  const { account } = useAuthContext()
  const {
    data: productsPage,
    isError: hasProductsError,
    isLoading: isLoadingProducts,
    isPending: isPendingProducts,
    refetch: refetchProducts,
  } = useProductsQuery(search)
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [isRegisterOpen, setRegisterOpen] = useState(false)
  const hasFilters = Boolean(
    search.search || search.categories.length || search.status || search.stockSituation,
  )

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
    canManageTypes: account?.profile === UserProfile.Manager,
    hasProductsError,
    hasFilters,
    isFilterOpen,
    isLoadingProducts,
    isRegisterOpen,
    isPendingProducts,
    productsPage,
    handleEmptyStateClear,
    handleFilterOpenChange,
    handleOpenFilter,
    handleRegisterOpenChange,
    refetchProducts,
  }
}

export type { ProductsSearch }
