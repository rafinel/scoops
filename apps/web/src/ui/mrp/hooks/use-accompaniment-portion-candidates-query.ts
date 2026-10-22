import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useAccompanimentPortionCandidatesQuery(
  productId: string,
  enabled = true,
) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.accompanimentPortionCandidates(productId),
    queryFn: async () => {
      const response = await mrpService.listAccompanimentPortionCandidates(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId),
    retry: false,
  })
}
