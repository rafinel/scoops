import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { communicationQueryKeys } from './communication-query-keys'

export const useRecentNotificationsQuery = () => {
  const { communicationService } = useRestContext()
  const query = useQuery({
    queryKey: communicationQueryKeys.recent(),
    queryFn: async () => {
      const response = await communicationService.listNotifications({ limit: 3 })
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })

  return {
    ...query,
    isLoadingRecentNotifications: query.isLoading,
    recentNotifications: query.data?.items ?? [],
    recentNotificationsError: query.error,
    unreadCount: query.data?.unreadCount ?? 0,
    refetchRecentNotifications: query.refetch,
  }
}
