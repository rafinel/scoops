import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { RegisterProductSizeInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useRegisterProductSizeAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: RegisterProductSizeInput) => {
      const response = await mrpService.registerProductSize(productId, input)
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
    registerProductSize: mutation.mutateAsync,
  }
}
