import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ComboListParams } from '@scoops/core/pdv/domain/structures'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type DiscountsSearch = Omit<ComboListParams, 'establishmentId'>

export function useDiscountsQuery(search: DiscountsSearch) {
  const { pdvService } = useRestContext()
  const {
    data: discountsPage,
    error: discountsError,
    isError: isDiscountsError,
    isFetching: isFetchingDiscounts,
    isPlaceholderData: isPlaceholderDiscounts,
    isPending: isLoadingDiscounts,
    refetch: refetchDiscounts,
  } = useQuery({
    queryKey: discountQueryKeys.list(search),
    queryFn: async () => {
      const response = await pdvService.listCombos(search)
      if (response.isFailure) response.throwError()
      return response.body
    },
    placeholderData: keepPreviousData,
    retry: false,
  })

  return {
    discountsError,
    discountsPage,
    isDiscountsError,
    isFetchingDiscounts,
    isLoadingDiscounts,
    isPageLoadingDiscounts: isFetchingDiscounts && isPlaceholderDiscounts,
    isRefreshingDiscounts:
      isFetchingDiscounts && discountsPage !== undefined && !isPlaceholderDiscounts,
    refetchDiscounts,
  }
}
