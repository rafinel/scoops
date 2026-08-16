import type { Account } from '#identity/domain/entities/account.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { UserSummary } from '#identity/domain/structures/user-summary.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  actor: Account
  search?: string
  profile?: UserProfile
  status?: UserStatus
  page: number
  pageSize: number
}

export class ListUsersUseCase
  implements UseCase<Request, PaginationResponse<UserSummary>>
{
  constructor(private readonly database: IdentityDatabase) {}

  async execute(request: Request): Promise<PaginationResponse<UserSummary>> {
    if (request.actor.profile !== 'manager')
      throw new AuthorizationError('Manager access required')
    const page = Math.max(1, Math.floor(request.page))
    const pageSize = Math.min(100, Math.max(1, Math.floor(request.pageSize)))
    const result = await this.database.run(({ usersRepository }) =>
      usersRepository.findMany({
        establishmentId: request.actor.establishmentId,
        excludeUserId: request.actor.id,
        search: request.search?.trim() || undefined,
        profile: request.profile,
        status: request.status,
        page,
        pageSize,
      }),
    )
    return new PaginationResponse(
      result.items.map(
        ({ id, name, email, profile, status, lastAccessAt, createdAt }) => ({
          id,
          name,
          email,
          profile,
          status,
          lastAccessAt,
          createdAt,
        }),
      ),
      result.page,
      result.pageSize,
      result.total,
      result.totalPages,
    )
  }
}
