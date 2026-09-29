import { useState } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import type { DiscountStatus, DiscountType } from '@scoops/core/pdv/domain/structures'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { discountDetailsRoute } from '@/constants/routes'
import {
  useDiscountsQuery,
  type DiscountsSearch,
} from '@/ui/pdv/hooks/use-discounts-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export type DiscountsPageSearchChange = Partial<DiscountsSearch>

const createSearchHandlers = (
  search: DiscountsSearch,
  navigate: (options: never) => void,
) => {
  const updateSearch = (nextSearch: DiscountsPageSearchChange) => {
    const next = { ...search, ...nextSearch }
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
  return {
    handleSearchChange: (value: string) => updateSearch({ search: value, page: 1 }),
    handleTypeChange: (type: DiscountType | undefined) => updateSearch({ type, page: 1 }),
    handleStatusChange: (status: DiscountStatus | undefined) =>
      updateSearch({ status, page: 1 }),
    handlePageChange: (page: number) => updateSearch({ page: Math.max(1, page) }),
    handleClearFilters: () =>
      updateSearch({ search: undefined, type: undefined, status: undefined, page: 1 }),
  }
}

export function useDiscountsPage() {
  const { account } = useAuthContext()
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
    isPageLoadingDiscounts,
    isRefreshingDiscounts,
    refetchDiscounts,
  } = useDiscountsQuery(search)
  const [isTypeDialogOpen, setTypeDialogOpen] = useState(false)
  const searchHandlers = createSearchHandlers(search, navigate)

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
    canManageDiscounts: account?.profile === UserProfile.Manager,
    discountsError,
    discountsPage,
    hasFilters: Boolean(search.search || search.type || search.status),
    isDiscountsError,
    isFetchingDiscounts,
    isLoadingDiscounts,
    isRefreshingDiscounts,
    isPageLoadingDiscounts,
    isTypeDialogOpen,
    search,
    ...searchHandlers,
    handleChooseCombo,
    handleCreate,
    handleDetails,
    handleRetry,
    handleTypeDialogOpenChange,
  }
}
