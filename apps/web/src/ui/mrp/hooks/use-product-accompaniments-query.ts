import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useProductAccompanimentsQuery(productId: string) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.productAccompaniments(productId),
    queryFn: async () => {
      const response = await mrpService.getProductAccompaniments(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(productId),
    retry: false,
  })
}
