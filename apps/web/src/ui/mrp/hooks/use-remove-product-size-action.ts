import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useRemoveProductSizeAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (sizeId: string) => {
      const response = await mrpService.removeProductSize(productId, sizeId)
      if (response.isFailure) response.throwError()
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
    removeProductSize: mutation.mutateAsync,
  }
}
