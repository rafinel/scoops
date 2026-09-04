import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { PasswordRecoveryIdentityProvider } from '#identity/interfaces/password-recovery-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { email: string; recoveryRedirectTo: string }

export class RequestPasswordRecoveryUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly provider: PasswordRecoveryIdentityProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<void> {
    const now = this.datetimeProvider.now()
    const email = request.email.trim().toLowerCase()
    const user = await this.database.run(({ usersRepository }) =>
      usersRepository.findByEmail(email),
    )
    if (!user) return

    await this.database.run(async (scope) => {
      const event = await this.provider.preparePasswordRecovery({
        providerSubject: user.id,
        recoveryRedirectTo: request.recoveryRedirectTo,
      })
      await scope.userAuditRecordsRepository?.add({
        id: `${user.id}:${now.toISOString()}:password-recovery`,
        establishmentId: user.establishmentId,
        affectedUserId: user.id,
        affectedUserName: user.name,
        actorType: UserAuditActorType.System,
        actorName: 'System',
        action: UserAuditAction.PasswordRecoveryInitiated,
        occurredAt: now,
      })
      await this.broker.publish(event)
    })
  }
}
