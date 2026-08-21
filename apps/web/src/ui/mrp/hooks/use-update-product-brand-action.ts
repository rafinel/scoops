import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateProductBrandInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

type UpdateProductBrandActionInput = UpdateProductBrandInput & { brandId: string }

export const useUpdateProductBrandAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ brandId, ...input }: UpdateProductBrandActionInput) => {
      const response = await mrpService.updateProductBrand(productId, brandId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.productStock(productId),
      })
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    updateProductBrand: mutation.mutateAsync,
  }
}
