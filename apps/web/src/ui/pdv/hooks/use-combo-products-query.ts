import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useComboProductsQuery = (
  search: string,
  kind: SaleItemKind | undefined,
  enabled: boolean,
) => {
  const { pdvService } = useRestContext()
  const query = useQuery({
    enabled,
    queryKey: discountQueryKeys.catalog({
      search: search || undefined,
      page: 1,
      pageSize: 50,
      kind,
    }),
    queryFn: async () => {
      const response = await pdvService.listComboProducts({
        kind,
        page: 1,
        pageSize: 50,
        search: search || undefined,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    placeholderData: keepPreviousData,
    retry: false,
  })

  return {
    catalogError: query.error,
    catalogPage: query.data,
    isCatalogError: query.isError,
    isLoadingCatalog: query.isPending,
  }
}
