import { useMutation } from '@tanstack/react-query'
import type { Account } from '@scoops/core/identity/domain/entities'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useActionUtils } from './action-utils'

export const useChangeOwnUserNameAction = () => {
  const { identityService } = useRestContext()
  const { refreshAccount, retryLocalAccess } = useAuthContext()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async (name: string): Promise<Account> => {
      try {
        const response = await identityService.changeOwnUserName(name)
        if (response.statusCode === HTTP_STATUS_CODE.unauthorized) {
          await retryLocalAccess()
        }
        const account = ensureSuccessfulResponse(response)
        await refreshAccount()
        return account
      } catch (error) {
        throw toActionError(error, 'Não foi possível atualizar seu nome.')
      }
    },
  })

  return {
    changeOwnUserName: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
