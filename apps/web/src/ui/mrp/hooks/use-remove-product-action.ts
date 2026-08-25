import { useMutation, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@scoops/core/shared/domain/errors'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { mrpQueryKeys } from './mrp-query-keys'

export const useRemoveProductAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const { navigateTo } = useNavigation()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await mrpService.removeProduct(productId)
      if (response.isFailure) response.throwError()
      if (response.statusCode !== HTTP_STATUS_CODE.noContent) {
        throw new AppError('A remoção do produto não foi confirmada.')
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all })
      await navigateTo('products')
    },
  })

  return {
    removeProductError: mutation.error,
    isRemovingProduct: mutation.isPending,
    removeProduct: mutation.mutateAsync,
  }
}
