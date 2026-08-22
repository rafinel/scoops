import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useProductRecipeQuery = (productId: string, enabled = true) => {
  const { mrpService } = useRestContext()
  return useQuery({
    queryKey: mrpQueryKeys.productRecipe(productId),
    queryFn: async () => {
      const response = await mrpService.getProductRecipe(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(productId) && enabled,
    retry: false,
  })
}
