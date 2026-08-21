import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AdjustProductStockInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useAdjustProductStockAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: AdjustProductStockInput) => {
      const response = await mrpService.adjustProductStock(productId, input)
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
    adjustProductStock: mutation.mutateAsync,
  }
}
