import type { ComboDetails } from '@scoops/core/pdv/domain/structures'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

export type DiscountsListPage = PaginationResponse<ComboDetails>

export type DiscountsListHookProps = {
  hasFilters: boolean
  page?: DiscountsListPage
}

export function useDiscountsList({ hasFilters, page }: DiscountsListHookProps) {
  const discounts = page?.items ?? []
  const firstItem = page && page.total > 0 ? (page.page - 1) * page.pageSize + 1 : 0
  const lastItem = page ? Math.min(page.page * page.pageSize, page.total) : 0

  return {
    discounts,
    firstItem,
    hasFilters,
    lastItem,
    pageCount: page?.totalPages ?? 0,
    pageNumber: page?.page ?? 1,
    pageSize: page?.pageSize ?? 10,
    total: page?.total ?? 0,
  }
}
