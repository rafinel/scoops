import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export const useSalesChannelsQuery = () => {
  const { pdvService } = useRestContext()
  const {
    data: salesChannelsData,
    error: salesChannelsError,
    isError: isSalesChannelsError,
    isFetching: isFetchingSalesChannels,
    isPending: isLoadingSalesChannels,
    refetch: refetchSalesChannels,
  } = useQuery({
    queryKey: salesChannelQueryKeys.list(),
    queryFn: async () => {
      const response = await pdvService.listSalesChannels()
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })

  return {
    isRefreshingSalesChannels: isFetchingSalesChannels && salesChannelsData !== undefined,
    isLoadingSalesChannels,
    isSalesChannelsError,
    refetchSalesChannels,
    salesChannels: salesChannelsData ?? [],
    salesChannelsError,
  }
}
