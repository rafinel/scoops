import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { communicationQueryKeys } from './communication-query-keys'

const READ_BATCH_SIZE = 50

export const useMarkNotificationsReadAction = () => {
  const { communicationService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (notificationIds: readonly string[]) =>
      communicationService.markNotificationsRead(notificationIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: communicationQueryKeys.all })
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
