import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserDetails } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export type CorrectUserNameInput = { userId: string; name: string }

export const useCorrectUserNameAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ userId, name }: CorrectUserNameInput): Promise<UserDetails> => {
      try {
        return ensureSuccessfulResponse(
          await identityService.correctUserName(userId, name),
        )
      } catch (error) {
        throw toActionError(error, 'Unable to correct user name')
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
    correctUserName: mutation.mutateAsync,
  }
}
