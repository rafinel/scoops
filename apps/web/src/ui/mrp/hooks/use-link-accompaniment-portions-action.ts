import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { LinkAccompanimentPortionsInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useLinkAccompanimentPortionsAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: LinkAccompanimentPortionsInput) => {
      const response = await mrpService.linkAccompanimentPortions(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.products(),
      }),
  })
  return { ...mutation, linkAccompanimentPortions: mutation.mutateAsync }
}
