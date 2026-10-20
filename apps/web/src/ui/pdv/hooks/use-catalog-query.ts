import {
  keepPreviousData,
  useQuery,
  type Query,
  type QueryKey,
} from '@tanstack/react-query'

import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

type UseCatalogQueryProps<Page> = {
  queryKey: QueryKey
  fetchPage: () => Promise<RestResponse<Page>>
  enabled?: boolean
  isSearching: boolean
}

// A searched page may list unavailable products, so it must never stand in for the default list.
function keepPreviousUnlessLeavingSearch(isSearching: boolean) {
  return function selectPlaceholderData<Data>(
    previousData: Data | undefined,
    previousQuery?: Query<Data>,
  ) {
    return previousQuery?.meta?.isSearching && !isSearching
      ? undefined
      : keepPreviousData(previousData)
  }
}

export function useCatalogQuery<Page>({
  queryKey,
  fetchPage,
  enabled,
  isSearching,
}: UseCatalogQueryProps<Page>) {
  const query = useQuery({
    enabled,
    queryKey,
    meta: { isSearching },
    queryFn: async () => {
      const response = await fetchPage()
      if (response.isFailure) response.throwError()
      return response.body
    },
    placeholderData: keepPreviousUnlessLeavingSearch(isSearching),
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
