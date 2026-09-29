import { useQuery } from '@tanstack/react-query'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useActionUtils } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export const useGlobalSearchQuery = (query: string) => {
  const { identityService } = useRestContext()
  const { account } = useAuthContext()
  const { ensureSuccessfulResponse } = useActionUtils()
  const establishmentId = account?.establishmentId ?? ''
  const profile = account?.profile ?? UserProfile.Operator

  return useQuery({
    queryKey: identityQueryKeys.globalSearch(establishmentId, profile, query),
    queryFn: async () =>
      ensureSuccessfulResponse(await identityService.searchGlobal(query)),
    enabled: Boolean(establishmentId && query.trim().length > 0 && query.length <= 100),
    retry: false,
    staleTime: 0,
  })
}
