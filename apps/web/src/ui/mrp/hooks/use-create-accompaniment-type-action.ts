import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SaveAccompanimentTypeInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useCreateAccompanimentTypeAction() {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: SaveAccompanimentTypeInput) => {
      const response = await mrpService.createAccompanimentType(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all }),
  })
  return { ...mutation, createAccompanimentType: mutation.mutateAsync }
}
