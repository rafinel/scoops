import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export const useActiveSalesChannelsQuery = () => {
  const { pdvService } = useRestContext()
  const {
    data: activeSalesChannels = [],
    error: activeSalesChannelsError,
    isError: isActiveSalesChannelsError,
    isPending: isLoadingActiveSalesChannels,
    refetch: refetchActiveSalesChannels,
  } = useQuery({
    queryKey: salesChannelQueryKeys.active(),
    queryFn: async () => {
      const response = await pdvService.listActiveSalesChannels()
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })

  return {
    activeSalesChannels,
    activeSalesChannelsError,
    isActiveSalesChannelsError,
    isLoadingActiveSalesChannels,
    refetchActiveSalesChannels,
  }
}
