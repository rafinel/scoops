import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'
import type { GlobalSearchProviderInput } from '@scoops/core/identity/domain/structures'
import type { IdentityGlobalSearchProvider } from '@scoops/core/identity/interfaces'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'

@Injectable()
export class IdentityGlobalSearchProviderAdapter implements IdentityGlobalSearchProvider {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
  ) {}

  searchUsers(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]> {
    return this.usersRepository
      .findMany(toUserSearchParams(input))
      .then(({ items }) => items.map(toUserHit))
  }
}

function toUserSearchParams(
  input: GlobalSearchProviderInput,
): Parameters<UsersRepository['findMany']>[0] {
  return {
    establishmentId: input.establishmentId,
    excludeUserId: input.currentUserId,
    search: input.query,
    page: 1,
    pageSize: input.limit,
  }
}

function toUserHit(
  user: Awaited<ReturnType<UsersRepository['findMany']>>['items'][number],
): GlobalSearchHit {
  return {
    kind: 'user',
    userId: user.id,
    label: user.name,
    context: user.email,
    status: user.status,
  }
}
