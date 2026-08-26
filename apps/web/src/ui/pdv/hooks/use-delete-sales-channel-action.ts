import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export const useDeleteSalesChannelAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await pdvService.removeSalesChannel(channelId)
      if (response.isFailure) response.throwError()
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelQueryKeys.all }),
  })

  return {
    deleteSalesChannel: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
