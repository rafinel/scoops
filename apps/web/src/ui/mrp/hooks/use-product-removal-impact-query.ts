import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useProductRemovalImpactQuery = (productId: string, enabled = false) => {
  const { mrpService } = useRestContext()

  const query = useQuery({
    queryKey: [...mrpQueryKeys.products(), productId, 'removal-impact'],
    queryFn: async () => {
      const response = await mrpService.getProductRemovalImpact(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId),
    retry: false,
  })

  return {
    productRemovalImpact: query.data,
    productRemovalImpactError: query.error,
    hasProductRemovalImpactError: query.isError,
    isLoadingProductRemovalImpact: query.isLoading,
    isPendingProductRemovalImpact: query.isPending,
    retryProductRemovalImpact: query.refetch,
  }
}
