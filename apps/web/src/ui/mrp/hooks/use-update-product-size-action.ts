import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateProductSizeInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useUpdateProductSizeAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      sizeId,
      input,
    }: {
      sizeId: string
      input: UpdateProductSizeInput
    }) => {
      const response = await mrpService.updateProductSize(productId, sizeId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.productPricing(productId),
      })
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    updateProductSize: mutation.mutateAsync,
  }
}
