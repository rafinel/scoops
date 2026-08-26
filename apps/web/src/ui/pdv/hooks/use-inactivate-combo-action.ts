import { useMutation, useQueryClient } from '@tanstack/react-query'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ComboLifecycleActionInput = { comboId: string; expectedUpdatedAt: Date }

export const useInactivateComboAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ comboId, expectedUpdatedAt }: ComboLifecycleActionInput) => {
      const response = await pdvService.inactivateCombo(comboId, expectedUpdatedAt)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discountQueryKeys.all }),
  })

  return { inactivateCombo: mutation.mutateAsync, isPending: mutation.isPending }
}
