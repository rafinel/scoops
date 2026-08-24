import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { SaveProductResaleConfigurationInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useSaveProductResaleConfigurationAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      brandId,
      input,
    }: {
      brandId?: string
      input: SaveProductResaleConfigurationInput
    }) => {
      const response = brandId
        ? await mrpService.saveBrandResaleConfiguration(productId, brandId, input)
        : await mrpService.saveSingleResaleConfiguration(productId, input)
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
    saveProductResaleConfiguration: mutation.mutateAsync,
  }
}
