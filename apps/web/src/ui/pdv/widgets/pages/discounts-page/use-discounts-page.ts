import { useState } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import type { DiscountStatus, DiscountType } from '@scoops/core/pdv/domain/structures'

import { discountDetailsRoute } from '@/constants/routes'
import {
  useDiscountsQuery,
  type DiscountsSearch,
} from '@/ui/pdv/hooks/use-discounts-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type DiscountsPageSearchChange = Partial<DiscountsSearch>

export function useDiscountsPage() {
  const searchParams = useSearch({ strict: false }) as Partial<DiscountsSearch>
  const search: DiscountsSearch = {
    page: searchParams.page ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    search: searchParams.search,
    status: searchParams.status,
    type: searchParams.type,
  }
  const navigate = useNavigate({ from: '/discounts/' as never })
  const { navigateTo, navigateToPath } = useNavigation()
  const {
    discountsError,
    discountsPage,
    isDiscountsError,
    isFetchingDiscounts,
    isLoadingDiscounts,
    refetchDiscounts,
  } = useDiscountsQuery(search)
  const [isTypeDialogOpen, setTypeDialogOpen] = useState(false)

  function updateSearch(nextSearch: DiscountsPageSearchChange) {
    const next = {
      ...search,
      ...nextSearch,
    }

    void navigate({
      search: {
        search: next.search || undefined,
        type: next.type,
        status: next.status,
        page: next.page === 1 ? undefined : next.page,
        pageSize: next.pageSize === 10 ? undefined : next.pageSize,
      },
    } as never)
  }

  function handleSearchChange(value: string) {
    updateSearch({ search: value, page: 1 })
  }

  function handleTypeChange(type: DiscountType | undefined) {
    updateSearch({ type, page: 1 })
  }

  function handleStatusChange(status: DiscountStatus | undefined) {
    updateSearch({ status, page: 1 })
  }

  function handlePageChange(page: number) {
    updateSearch({ page: Math.max(1, page) })
  }

  function handleClearFilters() {
    updateSearch({ search: undefined, type: undefined, status: undefined, page: 1 })
  }

  function handleCreate() {
    setTypeDialogOpen(true)
  }

  function handleTypeDialogOpenChange(open: boolean) {
    setTypeDialogOpen(open)
  }

  function handleChooseCombo() {
    setTypeDialogOpen(false)
    void navigateTo('newDiscount')
  }

  function handleDetails(discountId: string) {
    void navigateToPath(discountDetailsRoute(discountId))
  }

  function handleRetry() {
    void refetchDiscounts()
  }

  return {
    discountsError,
    discountsPage,
    hasFilters: Boolean(search.search || search.type || search.status),
    isDiscountsError,
    isFetchingDiscounts,
    isLoadingDiscounts,
    isTypeDialogOpen,
    search,
    handleClearFilters,
    handleChooseCombo,
    handleCreate,
    handleDetails,
    handlePageChange,
    handleRetry,
    handleSearchChange,
    handleStatusChange,
    handleTypeChange,
    handleTypeDialogOpenChange,
  }
}
