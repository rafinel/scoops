import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { SalesChannelUpdate } from '@scoops/core/pdv/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export type UpdateSalesChannelActionInput = {
  channelId: string
  input: SalesChannelUpdate
}

export const useUpdateSalesChannelAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ channelId, input }: UpdateSalesChannelActionInput) => {
      const response = await pdvService.updateSalesChannel(channelId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelQueryKeys.all }),
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    updateSalesChannel: mutation.mutateAsync,
  }
}
