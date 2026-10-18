import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useAccompanimentCandidatesQuery(productId: string, enabled = true) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.accompanimentCandidates(productId),
    queryFn: async () => {
      const response = await mrpService.listProductAccompanimentCandidates(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId),
    placeholderData: (previousData) => previousData,
    retry: false,
  })
}
