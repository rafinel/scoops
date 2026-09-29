import { useCallback } from 'react'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'

import type { Notification } from '@scoops/core/communication/domain/entities'
import type {
  NotificationCursor,
  NotificationPage,
} from '@scoops/core/communication/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { communicationQueryKeys } from './communication-query-keys'

const READ_BATCH_SIZE = 50

export const useMarkNotificationsReadAction = () => {
  const { communicationService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (notificationIds: readonly string[]) => {
      const response = await communicationService.markNotificationsRead(notificationIds)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async (notificationIds) => {
      const markedIds = new Set(notificationIds)
      const readAt = new Date()
      queryClient.setQueriesData<
        InfiniteData<NotificationPage, NotificationCursor | undefined>
      >({ queryKey: [...communicationQueryKeys.all, 'notifications'] }, (data) =>
        updateReadNotifications(data, markedIds, readAt),
      )
      await queryClient.invalidateQueries({ queryKey: communicationQueryKeys.recent() })
    },
    retry: false,
  })

  const markNotificationsRead = useCallback(
    async (notificationIds: readonly string[]) => {
      for (let index = 0; index < notificationIds.length; index += READ_BATCH_SIZE) {
        const batch = notificationIds.slice(index, index + READ_BATCH_SIZE)
        await mutation.mutateAsync(batch)
      }
    },
    [mutation.mutateAsync],
  )

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    markNotificationsRead,
  }
}

function updateReadNotifications(
  data: InfiniteData<NotificationPage, NotificationCursor | undefined> | undefined,
  markedIds: ReadonlySet<string>,
  readAt: Date,
) {
  if (!data) return data

  const newlyReadIds = new Set<string>()
  for (const page of data.pages) {
    for (const notification of page.items) {
      if (markedIds.has(notification.id) && !notification.readAt) {
        newlyReadIds.add(notification.id)
      }
    }
  }
  if (newlyReadIds.size === 0) return data

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((notification: Notification) =>
        newlyReadIds.has(notification.id) ? { ...notification, readAt } : notification,
      ),
      unreadCount: Math.max(0, page.unreadCount - newlyReadIds.size),
    })),
  }
}
