import { useMutation } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'

export type AcceptUserInvitationInput = { confirmationToken: string }

export const useAcceptUserInvitationAction = () => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async (input: AcceptUserInvitationInput): Promise<void> => {
      try {
        ensureSuccessfulResponse(await identityService.acceptUserInvitation(input))
      } catch (error) {
        throw toActionError(error, 'Unable to accept user invitation')
      }
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    acceptUserInvitation: mutation.mutateAsync,
  }
}
