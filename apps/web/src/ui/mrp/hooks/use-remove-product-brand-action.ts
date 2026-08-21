import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useRemoveProductBrandAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (brandId: string) => {
      const response = await mrpService.removeProductBrand(productId, brandId)
      if (response.isFailure) response.throwError()
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
    removeProductBrand: mutation.mutateAsync,
  }
}
