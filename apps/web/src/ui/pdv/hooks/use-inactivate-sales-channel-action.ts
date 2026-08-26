import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export const useInactivateSalesChannelAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await pdvService.inactivateSalesChannel(channelId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelQueryKeys.all }),
  })

  return {
    error: mutation.error,
    inactivateSalesChannel: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
