import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useRemoveAccompanimentTypeAction() {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (typeId: string) => {
      const response = await mrpService.removeAccompanimentType(typeId)
      if (response.isFailure) response.throwError()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all }),
  })
  return { ...mutation, removeAccompanimentType: mutation.mutateAsync }
}
