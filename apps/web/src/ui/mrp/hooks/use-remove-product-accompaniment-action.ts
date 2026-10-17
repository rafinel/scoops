import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AccompanimentRemovalScope } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

type RemoveProductAccompanimentVariables = {
  linkId: string
  scope?: AccompanimentRemovalScope
}

export function useRemoveProductAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ linkId, scope }: RemoveProductAccompanimentVariables) => {
      const response = await mrpService.removeProductAccompaniment(
        productId,
        linkId,
        scope,
      )
      if (response.isFailure) response.throwError()
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.products(),
      }),
  })

  function removeProductAccompaniment(linkId: string, scope?: AccompanimentRemovalScope) {
    return mutation.mutateAsync({ linkId, scope })
  }

  return { ...mutation, removeProductAccompaniment }
}
