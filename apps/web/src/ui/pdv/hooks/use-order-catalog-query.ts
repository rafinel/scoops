import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

import { useCatalogQuery } from '@/ui/pdv/hooks/use-catalog-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { saleQueryKeys } from './sale-query-keys'

export const useOrderCatalogQuery = (
  search: string | undefined,
  kind: SaleItemKind | undefined,
  page: number,
) => {
  const { pdvService } = useRestContext()
  const params = { search: search || undefined, kind, page, pageSize: 20 }
  const { isFetching, isPlaceholderData, ...query } = useCatalogQuery({
    queryKey: saleQueryKeys.catalog(params),
    fetchPage: () => pdvService.listOrderCatalog(params),
  })

  return {
    ...query,
    isPageLoadingCatalog: isFetching && isPlaceholderData,
    isRefreshingCatalog:
      isFetching && query.catalogPage !== undefined && !isPlaceholderData,
  }
}
