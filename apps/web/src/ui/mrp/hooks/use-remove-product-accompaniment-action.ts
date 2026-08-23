import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useRemoveProductAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await mrpService.removeProductAccompaniment(productId, linkId)
      if (response.isFailure) response.throwError()
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.productAccompaniments(productId),
      }),
  })
  return { ...mutation, removeProductAccompaniment: mutation.mutateAsync }
}
