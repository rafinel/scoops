import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  UpdateProductSettingsInput,
  ProductSettingsDetails,
} from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export type ProductSettingsField =
  | 'name'
  | 'idealStock'
  | 'status'
  | 'allowNegativeStock'
  | 'internalNotes'

export type UpdateProductSettingsActionInput = {
  field: ProductSettingsField
  input: UpdateProductSettingsInput
}

export const useUpdateProductSettingsAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation<
    ProductSettingsDetails,
    Error,
    UpdateProductSettingsActionInput
  >({
    mutationFn: async ({ input }) => {
      const response = await mrpService.updateProductSettings(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async (settings) => {
      await queryClient.invalidateQueries({ queryKey: mrpQueryKeys.all })
      queryClient.setQueryData(mrpQueryKeys.productSettings(productId), settings)
    },
  })

  return {
    updateProductSettingsError: mutation.error,
    isUpdatingProductSettings: mutation.isPending,
    updatingProductSettingsField: mutation.variables?.field,
    updateProductSettings: mutation.mutateAsync,
  }
}
