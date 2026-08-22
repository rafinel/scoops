import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProductionRequest } from '@scoops/core/mrp/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useRegisterProductionAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: ProductionRequest) => {
      const response = await mrpService.registerProduction(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mrpQueryKeys.productRecipe(productId),
        }),
        queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productStock(productId) }),
      ])
    },
  })
  return { ...mutation, registerProduction: mutation.mutateAsync }
}
