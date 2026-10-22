import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useGlobalAccompanimentQuery(productId: string, enabled = true) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.globalAccompaniment(productId),
    queryFn: async () => {
      const response = await mrpService.getGlobalAccompaniment(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId),
    retry: false,
  })
}
