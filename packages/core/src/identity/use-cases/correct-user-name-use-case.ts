import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserNameChangeNotAllowedError } from '#identity/domain/errors/user-name-change-not-allowed-error.ts'
import { UserUpdatedEvent } from '#identity/domain/events/user-updated-event.ts'

type Request = { actor: Account; userId: string; name: string }

export class CorrectUserNameUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}
  async execute(request: Request): Promise<UserDetails> {
    if (
      request.actor.profile !== UserProfile.Manager ||
      request.actor.id === request.userId
    )
      throw new UserNameChangeNotAllowedError()
    const name = request.name.trim()
    if (!name) throw new UserNameChangeNotAllowedError()
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
        if (target.name === name)
          return { user: target, changed: false, previousName: target.name }
        const user = await usersRepository.replace(target.establishmentId, target.id, {
          name,
          updatedAt: now,
        })
        await userAuditRecordsRepository?.add({
          id: `${user.id}:${now.toISOString()}:name`,
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
          affectedUserName: user.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: UserAuditAction.UserNameChanged,
          previousValue: target.name,
          newValue: user.name,
          occurredAt: now,
        })
        await eventsRepository.add(
          new UserUpdatedEvent({
            userId: user.id,
            establishmentId: user.establishmentId,
            actorUserId: request.actor.id,
            previousName: target.name,
            name: user.name,
            updatedAt: now,
          }),
        )
        return { user, changed: true, previousName: target.name }
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
