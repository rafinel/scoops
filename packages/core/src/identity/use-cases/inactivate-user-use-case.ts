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
import { UserInactivatedEvent } from '#identity/domain/events/user-inactivated-event.ts'

type Request = { actor: Account; userId: string }

export class InactivateUserUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}
  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('É necessário ter acesso de gerente.')
    const now = this.datetimeProvider.now()
    const result = await this.database.run(
      async ({
        usersRepository,
        userAuditRecordsRepository,
        authenticationSessionsRepository,
        eventsRepository,
      }: IdentityDatabaseRepositories) => {
        if (request.actor.id === request.userId)
          throw new UserStatusChangeNotAllowedError()
        const target = await usersRepository.findByIdInEstablishment(
          request.actor.establishmentId,
          request.userId,
        )
        if (!target) throw new NotFoundError('Usuário não encontrado.')
        if (target.status === UserStatus.Inactive) {
          const auditRecords = userAuditRecordsRepository
            ? await userAuditRecordsRepository.findManyByUser({
                establishmentId: target.establishmentId,
                affectedUserId: target.id,
              })
            : []
          return { user: target, auditRecords }
        }
        if (
          target.status !== UserStatus.Active ||
          (target.profile === UserProfile.Manager &&
            (await usersRepository.countActiveManagers(request.actor.establishmentId)) ===
              1)
        )
          throw new UserStatusChangeNotAllowedError()
        const user = await usersRepository.replace(target.establishmentId, target.id, {
          status: UserStatus.Inactive,
          updatedAt: now,
        })
        await userAuditRecordsRepository?.add({
          id: `${user.id}:${now.toISOString()}:inactive`,
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
          affectedUserName: user.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: UserAuditAction.UserInactivated,
          previousValue: UserStatus.Active,
          newValue: UserStatus.Inactive,
          occurredAt: now,
        })
        await authenticationSessionsRepository?.removeAllByProviderSubject(user.id)
        await eventsRepository.add(
          new UserInactivatedEvent({
            userId: user.id,
            establishmentId: user.establishmentId,
            email: user.email,
            userName: user.name,
            actorUserId: request.actor.id,
            previousStatus: UserStatus.Active,
            status: user.status,
            updatedAt: now,
          }),
        )
        const auditRecords = userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: user.establishmentId,
              affectedUserId: user.id,
            })
          : []
        return { user, auditRecords }
      },
    )
    return result
  }
}
