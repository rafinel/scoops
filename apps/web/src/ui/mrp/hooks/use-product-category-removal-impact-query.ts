import { useQuery } from '@tanstack/react-query'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useProductCategoryRemovalImpactQuery = (
  productId: string,
  category?: ProductCategory,
  enabled = true,
) => {
  const { mrpService } = useRestContext()

  const query = useQuery({
    queryKey: [
      ...mrpQueryKeys.products(),
      productId,
      'category-removal-impact',
      category,
    ],
    queryFn: async () => {
      const response = await mrpService.getProductCategoryRemovalImpact(
        productId,
        category as ProductCategory,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId) && Boolean(category),
    retry: false,
  })

  return {
    categoryRemovalImpact: query.data,
    categoryRemovalImpactError: query.error,
    hasCategoryRemovalImpactError: query.isError,
    isLoadingCategoryRemovalImpact: query.isLoading,
    isPendingCategoryRemovalImpact: query.isPending,
    retryCategoryRemovalImpact: query.refetch,
  }
}
