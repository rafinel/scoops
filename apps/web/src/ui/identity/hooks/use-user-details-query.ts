import { useQuery } from '@tanstack/react-query'

import type { UserDetails } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys } from './identity-query-keys'

export const useUserDetailsQuery = (userId: string) => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse } = useActionUtils()
  const query = useQuery({
    queryKey: identityQueryKeys.userDetails(userId),
    queryFn: async () =>
      ensureSuccessfulResponse(await identityService.getUserDetails(userId)),
    enabled: Boolean(userId),
    retry: false,
  })

  return { ...query, userDetails: query.data as UserDetails | undefined }
}
