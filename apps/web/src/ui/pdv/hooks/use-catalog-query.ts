import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query'

import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

type UseCatalogQueryProps<Page> = {
  queryKey: QueryKey
  fetchPage: () => Promise<RestResponse<Page>>
  enabled?: boolean
}

export function useCatalogQuery<Page>({
  queryKey,
  fetchPage,
  enabled,
}: UseCatalogQueryProps<Page>) {
  const query = useQuery({
    enabled,
    queryKey,
    queryFn: async () => {
      const response = await fetchPage()
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
    isLoadingCatalog: query.isPending && query.data === undefined,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    refetchCatalog: query.refetch,
  }
}
