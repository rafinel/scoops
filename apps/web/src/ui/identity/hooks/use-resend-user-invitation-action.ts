import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserDetails } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export const useResendUserInvitationAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async (userId: string): Promise<UserDetails> => {
      try {
        return ensureSuccessfulResponse(
          await identityService.resendUserInvitation(userId),
        )
      } catch (error) {
        throw toActionError(error, 'Unable to resend user invitation')
      }
    },
    onSuccess: async (_details, userId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: identityQueryKeys.usersRoot() }),
        queryClient.invalidateQueries({
          queryKey: identityQueryKeys.userDetails(userId),
        }),
      ])
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    resendUserInvitation: mutation.mutateAsync,
  }
}
