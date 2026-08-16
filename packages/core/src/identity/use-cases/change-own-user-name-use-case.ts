import type { Account } from '#identity/domain/entities/account.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { UserNameChangeNotAllowedError } from '#identity/domain/errors/user-name-change-not-allowed-error.ts'
import { UserUpdatedEvent } from '#identity/domain/events/user-updated-event.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { AppError } from '#shared/domain/errors/app-error.ts'

type Request = { actor: Account; name: string }

export class ChangeOwnUserNameUseCase implements UseCase<Request, Account> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<Account> {
    const name = request.name.trim()
    if (!name) throw new UserNameChangeNotAllowedError()

    const updatedAt = this.datetimeProvider.now()
    const result = await this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByIdInEstablishment(
        request.actor.establishmentId,
        request.actor.id,
      )
      const establishment = await scope.establishmentsRepository.findById(
        request.actor.establishmentId,
      )

      if (
        !user ||
        user.status !== UserStatus.Active ||
        !establishment ||
        establishment.id !== request.actor.establishmentId
      ) {
        throw new NotFoundError('Authenticated account not found')
      }

      if (user.name === name) {
        return {
          account: this.toAccount(
            user.id,
            user.establishmentId,
            user.name,
            user.email,
            user.profile,
            establishment.name,
          ),
          changed: false,
          previousName: user.name,
        }
      }

      const updatedUser = await scope.usersRepository.replace(
        request.actor.establishmentId,
        request.actor.id,
        { name, updatedAt },
      )
      const auditRepository = scope.userAuditRecordsRepository
      if (!auditRepository) throw new AppError('User audit repository is not configured')

      await auditRepository.add({
        id: `${updatedUser.id}:${updatedAt.toISOString()}:self-name`,
        establishmentId: updatedUser.establishmentId,
        affectedUserId: updatedUser.id,
        affectedUserName: updatedUser.name,
        actorType: UserAuditActorType.User,
        actorUserId: request.actor.id,
        actorName: request.actor.name,
        action: UserAuditAction.UserNameChanged,
        previousValue: user.name,
        newValue: updatedUser.name,
        occurredAt: updatedAt,
      })

      return {
        account: this.toAccount(
          updatedUser.id,
          updatedUser.establishmentId,
          updatedUser.name,
          updatedUser.email,
          updatedUser.profile,
          establishment.name,
        ),
        changed: true,
        previousName: user.name,
      }
    })

    if (result.changed)
      await this.broker?.publish(
        new UserUpdatedEvent({
          userId: result.account.id,
          establishmentId: result.account.establishmentId,
          actorUserId: request.actor.id,
          previousName: result.previousName,
          name: result.account.name,
          updatedAt,
        }),
      )

    return result.account
  }

  private toAccount(
    id: string,
    establishmentId: string,
    name: string,
    email: string,
    profile: Account['profile'],
    establishmentName: string,
  ): Account {
    return { id, establishmentId, establishmentName, name, email, profile }
  }
}
