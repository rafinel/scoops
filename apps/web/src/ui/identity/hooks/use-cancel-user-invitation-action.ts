import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export const useCancelUserInvitationAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      try {
        ensureSuccessfulResponse(await identityService.cancelUserInvitation(userId))
      } catch (error) {
        throw toActionError(error, 'Unable to cancel user invitation')
      }
    },
    onSuccess: async (_value, userId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: identityQueryKeys.usersRoot() }),
        queryClient.removeQueries({ queryKey: identityQueryKeys.userDetails(userId) }),
      ])
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    cancelUserInvitation: mutation.mutateAsync,
  }
}
