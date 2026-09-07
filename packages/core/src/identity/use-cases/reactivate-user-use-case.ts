import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserStatusChangeNotAllowedError } from '#identity/domain/errors/user-status-change-not-allowed-error.ts'
import { UserReactivatedEvent } from '#identity/domain/events/user-reactivated-event.ts'

type Request = { actor: Account; userId: string }

export class ReactivateUserUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}
  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Manager access required')
    const now = this.datetimeProvider.now()
    const result = await this.database.run(
      async ({
        usersRepository,
        userAuditRecordsRepository,
        eventsRepository,
      }: IdentityDatabaseRepositories) => {
        const target = await usersRepository.findByIdInEstablishment(
          request.actor.establishmentId,
          request.userId,
        )
        if (!target) throw new NotFoundError('User not found')
        if (target.status === UserStatus.Active) return { user: target, changed: false }
        if (target.status !== UserStatus.Inactive)
          throw new UserStatusChangeNotAllowedError()
        const user = await usersRepository.replace(target.establishmentId, target.id, {
          status: UserStatus.Active,
          updatedAt: now,
        })
        await userAuditRecordsRepository?.add({
          id: `${user.id}:${now.toISOString()}:active`,
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
          affectedUserName: user.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: UserAuditAction.UserReactivated,
          previousValue: UserStatus.Inactive,
          newValue: UserStatus.Active,
          occurredAt: now,
        })
        await eventsRepository.add(
          new UserReactivatedEvent({
            userId: user.id,
            establishmentId: user.establishmentId,
            email: user.email,
            userName: user.name,
            actorUserId: request.actor.id,
            previousStatus: UserStatus.Inactive,
            status: user.status,
            profile: user.profile,
            updatedAt: now,
          }),
        )
        return { user, changed: true }
      },
    )
    const records = await this.database.run(
      async ({ userAuditRecordsRepository }: IdentityDatabaseRepositories) =>
        userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: result.user.establishmentId,
              affectedUserId: result.user.id,
            })
          : [],
    )
    return { user: result.user, auditRecords: records }
  }
}
