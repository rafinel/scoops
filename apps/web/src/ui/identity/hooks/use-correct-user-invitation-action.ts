import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserProfile } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export type CorrectUserInvitationInput = {
  userId: string
  name: string
  email: string
  profile: UserProfile
}

export const useCorrectUserInvitationAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ userId, ...input }: CorrectUserInvitationInput) => {
      try {
        return ensureSuccessfulResponse(
          await identityService.correctUserInvitation(userId, input),
        )
      } catch (error) {
        throw toActionError(error, 'Unable to correct user invitation')
      }
    },
    onSuccess: async (_details, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: identityQueryKeys.usersRoot() }),
        queryClient.invalidateQueries({
          queryKey: identityQueryKeys.userDetails(input.userId),
        }),
      ])
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    correctUserInvitation: mutation.mutateAsync,
  }
}
