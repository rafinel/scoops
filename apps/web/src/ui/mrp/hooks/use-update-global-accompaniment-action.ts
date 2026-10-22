import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateGlobalAccompanimentInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useUpdateGlobalAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: UpdateGlobalAccompanimentInput) => {
      const response = await mrpService.updateGlobalAccompaniment(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.products(),
      }),
  })
  return { ...mutation, updateGlobalAccompaniment: mutation.mutateAsync }
}
