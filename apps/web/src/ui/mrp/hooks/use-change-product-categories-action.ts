import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  ChangeProductCategoriesInput,
  ProductSettingsDetails,
} from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useChangeProductCategoriesAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation<
    ProductSettingsDetails,
    Error,
    ChangeProductCategoriesInput
  >({
    mutationFn: async (input) => {
      const response = await mrpService.changeProductCategories(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all })
    },
  })

  return {
    changeProductCategoriesError: mutation.error,
    isChangingProductCategories: mutation.isPending,
    changeProductCategories: mutation.mutateAsync,
  }
}
