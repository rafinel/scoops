import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AddRecipeIngredientInput } from '@scoops/core/mrp/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useAddRecipeIngredientAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: AddRecipeIngredientInput) => {
      const response = await mrpService.addRecipeIngredient(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productRecipe(productId) }),
  })
  return { ...mutation, addRecipeIngredient: mutation.mutateAsync }
}
