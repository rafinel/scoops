import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserDetails, UserProfile } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export type ChangeUserProfileInput = { userId: string; profile: UserProfile }

export const useChangeUserProfileAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      userId,
      profile,
    }: ChangeUserProfileInput): Promise<UserDetails> => {
      try {
        return ensureSuccessfulResponse(
          await identityService.changeUserProfile(userId, profile),
        )
      } catch (error) {
        throw toActionError(error, 'Unable to change user profile')
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
    changeUserProfile: mutation.mutateAsync,
  }
}
