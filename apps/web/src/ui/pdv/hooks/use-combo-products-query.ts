import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useCatalogQuery } from '@/ui/pdv/hooks/use-catalog-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useComboProductsQuery = (
  search: string | undefined,
  kind: SaleItemKind | undefined,
  enabled: boolean,
) => {
  const { pdvService } = useRestContext()
  const params = { search: search || undefined, kind, page: 1, pageSize: 50 }
  const {
    isFetching,
    isPlaceholderData: _isPlaceholderData,
    ...query
  } = useCatalogQuery({
    enabled,
    queryKey: discountQueryKeys.catalog(params),
    fetchPage: () => pdvService.listComboProducts(params),
  })

  return {
    ...query,
    isRefreshingCatalog: isFetching && query.catalogPage !== undefined,
  }
}
