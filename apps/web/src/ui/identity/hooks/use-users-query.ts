import { useQuery } from '@tanstack/react-query'

import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import type { UserSummary } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys, type UsersQueryInput } from './identity-query-keys'

export const useUsersQuery = (input: UsersQueryInput) => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse } = useActionUtils()
  const query = useQuery({
    queryKey: identityQueryKeys.users(input),
    queryFn: async () => ensureSuccessfulResponse(await identityService.listUsers(input)),
    retry: false,
  })

  return {
    ...query,
    users: (query.data?.items ?? []) as readonly UserSummary[],
    pagination: query.data as PaginationResponse<UserSummary> | undefined,
  }
}
