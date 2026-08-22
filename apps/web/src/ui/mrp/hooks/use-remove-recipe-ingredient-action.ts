import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useRemoveRecipeIngredientAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (lineId: string) => {
      const response = await mrpService.removeRecipeIngredient(productId, lineId)
      if (response.isFailure) response.throwError()
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productRecipe(productId) }),
  })
  return { ...mutation, removeRecipeIngredient: mutation.mutateAsync }
}
