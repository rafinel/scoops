import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

type RemoveGlobalAccompanimentOptions = { keepPortionLinks?: boolean }

export function useRemoveGlobalAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (options?: RemoveGlobalAccompanimentOptions) => {
      const response = await mrpService.removeGlobalAccompaniment(productId, options)
      if (response.isFailure) response.throwError()
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.products(),
      }),
  })

  function removeGlobalAccompaniment(options?: RemoveGlobalAccompanimentOptions) {
    return mutation.mutateAsync(options)
  }

  return { ...mutation, removeGlobalAccompaniment }
}
