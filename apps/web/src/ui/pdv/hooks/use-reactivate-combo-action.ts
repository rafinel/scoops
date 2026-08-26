import { useMutation, useQueryClient } from '@tanstack/react-query'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useReactivateComboAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      comboId,
      expectedUpdatedAt,
    }: {
      comboId: string
      expectedUpdatedAt: Date
    }) => {
      const response = await pdvService.reactivateCombo(comboId, expectedUpdatedAt)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: discountQueryKeys.all }),
  })

  return { isPending: mutation.isPending, reactivateCombo: mutation.mutateAsync }
}
