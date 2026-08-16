import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserDetails, UserProfile } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export type InviteUserInput = { name: string; email: string; profile: UserProfile }

export const useInviteUserAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: InviteUserInput): Promise<UserDetails> => {
      try {
        return ensureSuccessfulResponse(await identityService.inviteUser(input))
      } catch (error) {
        throw toActionError(error, 'Unable to invite user')
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: identityQueryKeys.usersRoot() })
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    inviteUser: mutation.mutateAsync,
  }
}
