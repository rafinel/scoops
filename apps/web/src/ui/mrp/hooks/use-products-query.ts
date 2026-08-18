import { useQuery } from '@tanstack/react-query'

import type {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
} from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ProductsSearch = {
  search: string
  categories: ProductCategory[]
  status?: ProductStatus
  stockSituation?: 'normal' | 'low'
  sortBy: ProductSortField
  sortDirection: ProductSortDirection
  page: number
}

export function useProductsQuery(search: ProductsSearch) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: ['mrp', 'products', search],
    queryFn: async () => {
      const response = await mrpService.listProducts({ ...search, pageSize: 10 })
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
