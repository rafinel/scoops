import { useQuery } from '@tanstack/react-query'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useActionUtils } from './action-utils'

export const establishmentSettingsQueryKey = [
  'identity',
  'establishment-settings',
] as const

export const useEstablishmentSettingsQuery = () => {
  const { identityService } = useRestContext()
  const { retryLocalAccess } = useAuthContext()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()

  const query = useQuery({
    queryKey: establishmentSettingsQueryKey,
    queryFn: async () => {
      try {
        const response = await identityService.getEstablishmentSettings()
        if (response.statusCode === HTTP_STATUS_CODE.unauthorized) {
          await retryLocalAccess()
        }
        return ensureSuccessfulResponse(response)
      } catch (error) {
        throw toActionError(error, 'Não foi possível carregar as configurações da loja.')
      }
    },
  })

  return {
    settings: query.data,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
