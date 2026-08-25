import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  ChangeProductUnitInput,
  ProductSettingsDetails,
} from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useChangeProductUnitAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation<ProductSettingsDetails, Error, ChangeProductUnitInput>({
    mutationFn: async (input) => {
      const response = await mrpService.changeProductUnit(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.all,
        predicate: (query) => !query.queryKey.includes('unit-change-preview'),
      })
      queryClient.removeQueries({
        queryKey: mrpQueryKeys.productUnitChangePreviews(productId),
        exact: false,
      })
    },
  })

  return {
    changeProductUnitError: mutation.error,
    isChangingProductUnit: mutation.isPending,
    changeProductUnit: mutation.mutateAsync,
  }
}
