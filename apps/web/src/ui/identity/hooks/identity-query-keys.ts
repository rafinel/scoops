import type {
  UserProfile,
  UserStatus,
  UsersListParams,
} from '@scoops/core/identity/domain/structures'

export type UsersQueryInput = Omit<UsersListParams, 'establishmentId' | 'excludeUserId'>

export const identityQueryKeys = {
  all: ['identity'] as const,
  usersRoot: () => [...identityQueryKeys.all, 'users'] as const,
  users: (input: UsersQueryInput) =>
    [
      ...identityQueryKeys.usersRoot(),
      {
        search: input.search ?? '',
        profile: input.profile ?? null,
        status: input.status ?? null,
        page: input.page,
        pageSize: input.pageSize,
      },
    ] as const,
  userDetails: (userId: string) => [...identityQueryKeys.all, 'user', userId] as const,
}

export type { UserProfile, UserStatus }
