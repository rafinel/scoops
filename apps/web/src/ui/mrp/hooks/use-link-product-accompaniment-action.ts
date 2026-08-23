import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LinkProductAccompanimentInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useLinkProductAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: LinkProductAccompanimentInput) => {
      const response = await mrpService.linkProductAccompaniment(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.productAccompaniments(productId),
      }),
  })
  return { ...mutation, linkProductAccompaniment: mutation.mutateAsync }
}
