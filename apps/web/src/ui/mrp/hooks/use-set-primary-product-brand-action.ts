import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useSetPrimaryProductBrandAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (brandId: string) => {
      const response = await mrpService.setPrimaryProductBrand(productId, brandId)
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
    setPrimaryProductBrand: mutation.mutateAsync,
  }
}
