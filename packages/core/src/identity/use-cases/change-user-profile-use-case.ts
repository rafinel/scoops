import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { UserProfile as UserProfileValue } from '#identity/domain/structures/user-profile.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { UserProfileUpdatedEvent } from '#identity/domain/events/user-profile-updated-event.ts'

type Request = { actor: Account; userId: string; profile: UserProfileValue }

export class ChangeUserProfileUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<UserDetails> {
    const updatedAt = this.datetimeProvider.now()
    const result = await this.database.run(
      async ({
        usersRepository,
        userAuditRecordsRepository,
        eventsRepository,
      }: IdentityDatabaseRepositories) => {
        if (
          request.actor.profile !== UserProfile.Manager ||
          request.actor.id === request.userId
        )
          throw new ProfileChangeNotAllowedError()
        const target = await usersRepository.findByIdInEstablishment(
          request.actor.establishmentId,
          request.userId,
        )
        if (!target || target.establishmentId !== request.actor.establishmentId)
          throw new NotFoundError('Usuário não encontrado.')
        if (target.status !== UserStatus.Active) throw new ProfileChangeNotAllowedError()
        if (target.profile === request.profile)
          return { user: target, changed: false, previousProfile: target.profile }
        if (
          target.profile === UserProfile.Manager &&
          request.profile === UserProfile.Operator &&
          (await usersRepository.countActiveManagers(request.actor.establishmentId)) === 1
        )
          throw new ProfileChangeNotAllowedError()
        const user = await usersRepository.replace(
          request.actor.establishmentId,
          target.id,
          { profile: request.profile, updatedAt },
        )
        await userAuditRecordsRepository?.add({
          id: `${user.id}:${updatedAt.toISOString()}:profile`,
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
          affectedUserName: user.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: UserAuditAction.ProfileChanged,
          previousValue: target.profile,
          newValue: user.profile,
          occurredAt: updatedAt,
        })
        await eventsRepository.add(
          new UserProfileUpdatedEvent({
            userId: user.id,
            establishmentId: user.establishmentId,
            email: user.email,
            userName: user.name,
            actorUserId: request.actor.id,
            previousProfile: target.profile,
            profile: user.profile,
            updatedAt,
          }),
        )
        return { user, changed: true, previousProfile: target.profile }
      },
    )
    const auditRecords = await this.database.run(
      async ({ userAuditRecordsRepository }: IdentityDatabaseRepositories) =>
        userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: result.user.establishmentId,
              affectedUserId: result.user.id,
            })
          : [],
    )
    return { user: result.user, auditRecords }
  }
}
