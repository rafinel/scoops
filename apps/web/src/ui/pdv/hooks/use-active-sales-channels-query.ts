import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export const useActiveSalesChannelsQuery = () => {
  const { pdvService } = useRestContext()
  const {
    data: activeSalesChannelsData,
    error: activeSalesChannelsError,
    isError: isActiveSalesChannelsError,
    isFetching: isFetchingActiveSalesChannels,
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
    activeSalesChannelsError,
    isActiveSalesChannelsError,
    isRefreshingActiveSalesChannels:
      isFetchingActiveSalesChannels && activeSalesChannelsData !== undefined,
    isLoadingActiveSalesChannels,
    refetchActiveSalesChannels,
    activeSalesChannels: activeSalesChannelsData ?? [],
  }
}
