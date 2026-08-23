import { useQuery } from '@tanstack/react-query'

import {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
} from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useAccompanimentCandidatesQuery(productId: string, enabled = true) {
  const { mrpService } = useRestContext()
  const input = {
    categories: [ProductCategory.Accompaniment],
    status: ProductStatus.Active,
    sortBy: ProductSortField.Name,
    sortDirection: ProductSortDirection.Ascending,
    page: 1,
    pageSize: 100,
  }

  return useQuery({
    queryKey: mrpQueryKeys.accompanimentCandidates(input),
    queryFn: async () => {
      const response = await mrpService.listProducts(input)
      if (response.isFailure) response.throwError()
      return response.body.items
        .map(({ product }) => product)
        .filter((product) => product.id !== productId)
    },
    enabled: enabled && Boolean(productId),
    retry: false,
  })
}
