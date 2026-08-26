import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ComboUpdate } from '@scoops/core/pdv/domain/structures'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type UpdateComboActionInput = { comboId: string; input: ComboUpdate }

export const useUpdateComboAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ comboId, input }: UpdateComboActionInput) => {
      const response = await pdvService.updateCombo(comboId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discountQueryKeys.all }),
  })

  return {
    isPending: mutation.isPending,
    updateCombo: mutation.mutateAsync,
  }
}
