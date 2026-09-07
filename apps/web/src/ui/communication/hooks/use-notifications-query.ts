import { useInfiniteQuery } from '@tanstack/react-query'

import type { NotificationCursor } from '@scoops/core/communication/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import {
  communicationQueryKeys,
  notificationCursorKey,
  type NotificationBounds,
} from './communication-query-keys'

export type NotificationsQueryInput = NotificationBounds & {
  enabled?: boolean
  limit?: number
}

export const useNotificationsQuery = ({
  enabled = true,
  limit = 20,
  occurredFrom,
  occurredTo,
}: NotificationsQueryInput) => {
  const { communicationService } = useRestContext()
  const query = useInfiniteQuery({
    queryKey: communicationQueryKeys.notifications({ limit, occurredFrom, occurredTo }),
    queryFn: async ({ pageParam }: { pageParam: NotificationCursor | undefined }) => {
      const response = await communicationService.listNotifications({
        limit,
        occurredFrom,
        occurredTo,
        cursor: pageParam,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    initialPageParam: undefined as NotificationCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    retry: false,
  })

  const notifications = query.data?.pages
    .flatMap((page) => page.items)
    .filter((notification, index, items) => {
      return items.findIndex((candidate) => candidate.id === notification.id) === index
    })

  return {
    ...query,
    hasLoadedNotifications: Boolean(query.data),
    isLoadingNotifications: query.isLoading,
    isLoadingNextNotifications: query.isFetchingNextPage,
    notifications: notifications ?? [],
    notificationsError: query.error,
    unreadCount: query.data?.pages.at(-1)?.unreadCount ?? 0,
    nextCursor: query.data?.pages.at(-1)?.nextCursor,
    refetchNotifications: query.refetch,
    fetchNextNotifications: query.fetchNextPage,
    getNextCursorKey: notificationCursorKey,
  }
}
