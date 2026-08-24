import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useProductPricingQuery = (productId: string) => {
  const { mrpService } = useRestContext()

  const query = useQuery({
    queryKey: mrpQueryKeys.productPricing(productId),
    queryFn: async () => {
      const response = await mrpService.getProductPricing(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(productId),
    retry: false,
  })

  return {
    pricing: query.data,
    pricingError: query.isError,
    isLoadingPricing: query.isPending,
    retryPricing: query.refetch,
  }
}
