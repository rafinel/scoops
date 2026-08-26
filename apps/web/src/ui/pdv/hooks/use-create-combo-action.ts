import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ComboCreate } from '@scoops/core/pdv/domain/structures'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useCreateComboAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: Omit<ComboCreate, 'establishmentId'>) => {
      const response = await pdvService.createCombo(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discountQueryKeys.all }),
  })

  return {
    createCombo: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
