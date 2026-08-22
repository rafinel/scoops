import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SaveRecipeYieldInput } from '@scoops/core/mrp/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useSaveRecipeYieldAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: SaveRecipeYieldInput) => {
      const response = await mrpService.saveRecipeYield(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productRecipe(productId) }),
  })
  return { ...mutation, saveRecipeYield: mutation.mutateAsync }
}
