import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UserDetails, UserStatus } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export type ChangeUserStatusInput = {
  userId: string
  status: Extract<UserStatus, 'active' | 'inactive'>
}

export const useChangeUserStatusAction = () => {
  const { identityService } = useRestContext()
  const queryClient = useQueryClient()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: ChangeUserStatusInput): Promise<UserDetails> => {
      try {
        return ensureSuccessfulResponse(
          await identityService.changeUserStatus(userId, status),
        )
      } catch (error) {
        throw toActionError(error, 'Unable to change user status')
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
    changeUserStatus: mutation.mutateAsync,
  }
}
