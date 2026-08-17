import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useActionUtils } from './action-utils'
import { establishmentSettingsQueryKey } from './use-establishment-settings-query'

export const useChangeEstablishmentNameAction = () => {
  const { identityService } = useRestContext()
  const { retryLocalAccess } = useAuthContext()
  const queryClient = useQueryClient()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        const response = await identityService.changeEstablishmentName(name)
        if (response.statusCode === HTTP_STATUS_CODE.unauthorized) {
          await retryLocalAccess()
        }
        return ensureSuccessfulResponse(response)
      } catch (error) {
        throw toActionError(error, 'Não foi possível atualizar o nome da loja.')
      }
    },
    onSuccess: async (settings) => {
      queryClient.setQueryData(establishmentSettingsQueryKey, settings)
    },
  })

  return {
    changeEstablishmentName: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
