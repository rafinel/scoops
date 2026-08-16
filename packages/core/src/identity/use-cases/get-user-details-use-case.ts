import type { Account } from '#identity/domain/entities/account.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: Account; userId: string }

export class GetUserDetailsUseCase implements UseCase<Request, UserDetails> {
  constructor(private readonly database: IdentityDatabase) {}

  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== 'manager')
      throw new AuthorizationError('Manager access required')
    if (request.actor.id === request.userId) throw new NotFoundError('User not found')
    return this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByIdInEstablishment(
        request.actor.establishmentId,
        request.userId,
      )
      if (!user || user.establishmentId !== request.actor.establishmentId)
        throw new NotFoundError('User not found')
      const auditRecords = scope.userAuditRecordsRepository
        ? await scope.userAuditRecordsRepository.findManyByUser({
            establishmentId: request.actor.establishmentId,
            affectedUserId: user.id,
          })
        : []
      return {
        user,
        auditRecords: [...auditRecords].sort(
          (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
        ),
      }
    })
  }
}
