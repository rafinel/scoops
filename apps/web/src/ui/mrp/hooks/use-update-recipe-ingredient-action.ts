import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateRecipeIngredientInput } from '@scoops/core/mrp/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useUpdateRecipeIngredientAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      lineId,
      input,
    }: {
      lineId: string
      input: UpdateRecipeIngredientInput
    }) => {
      const response = await mrpService.updateRecipeIngredient(productId, lineId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productRecipe(productId) }),
  })
  return { ...mutation, updateRecipeIngredient: mutation.mutateAsync }
}
