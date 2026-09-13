import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { UserSummary, UsersPage } from '@scoops/core/identity/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'
import { identityQueryKeys, type UsersQueryInput } from './identity-query-keys'

export const useUsersQuery = (input: UsersQueryInput) => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse } = useActionUtils()
  const query = useQuery({
    queryKey: identityQueryKeys.users(input),
    queryFn: async () => ensureSuccessfulResponse(await identityService.listUsers(input)),
    placeholderData: keepPreviousData,
    retry: false,
  })

  return {
    ...query,
    isError: query.isError && !query.data,
    isPageLoading: query.isFetching && query.isPlaceholderData,
    isRefreshing: query.isFetching && Boolean(query.data) && !query.isPlaceholderData,
    users: (query.data?.items ?? []) as readonly UserSummary[],
    pagination: query.data as UsersPage<UserSummary> | undefined,
    summary: query.data?.summary,
  }
}
