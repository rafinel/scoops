import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { saleQueryKeys } from './sale-query-keys'

export const useOrderCatalogQuery = (
  search: string,
  kind: SaleItemKind | undefined,
  page: number,
) => {
  const { pdvService } = useRestContext()
  const query = useQuery({
    queryKey: saleQueryKeys.catalog({
      search: search || undefined,
      kind,
      page,
      pageSize: 20,
    }),
    queryFn: async () => {
      const response = await pdvService.listOrderCatalog({
        search: search || undefined,
        kind,
        page,
        pageSize: 20,
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
    refetchCatalog: query.refetch,
  }
}
