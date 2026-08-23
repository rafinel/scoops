import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SaveAccompanimentTypeInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useRenameAccompanimentTypeAction() {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      typeId,
      input,
    }: {
      typeId: string
      input: SaveAccompanimentTypeInput
    }) => {
      const response = await mrpService.renameAccompanimentType(typeId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all }),
  })
  return { ...mutation, renameAccompanimentType: mutation.mutateAsync }
}
