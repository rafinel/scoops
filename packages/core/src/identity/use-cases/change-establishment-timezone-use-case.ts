import type { Account } from '#identity/domain/entities/account.ts'
import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { EstablishmentAuditAction } from '#identity/domain/structures/establishment-audit-action.ts'
import type { EstablishmentSettings } from '#identity/domain/structures/establishment-settings.ts'
import {
  EstablishmentTimezone,
  type EstablishmentTimezone as EstablishmentTimezoneValue,
} from '#identity/domain/structures/establishment-timezone.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: Account; timeZone: EstablishmentTimezoneValue }

export class ChangeEstablishmentTimezoneUseCase
  implements UseCase<Request, EstablishmentSettings>
{
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<EstablishmentSettings> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new ProfileChangeNotAllowedError()

    if (!Object.values(EstablishmentTimezone).includes(request.timeZone))
      throw new BadRequestError('Fuso horário não suportado.')

    const updatedAt = this.datetimeProvider.now()

    return this.database.run(
      async ({
        establishmentsRepository,
        establishmentAuditRecordsRepository,
      }: IdentityDatabaseRepositories) => {
        const establishment = await establishmentsRepository.findById(
          request.actor.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Estabelecimento não encontrado.')

        if (establishment.timeZone === request.timeZone)
          return this.toSettings(establishment, request.actor)

        const updatedEstablishment = await establishmentsRepository.replace(
          request.actor.establishmentId,
          { timeZone: request.timeZone, updatedAt },
        )
        if (!establishmentAuditRecordsRepository)
          throw new NotFoundError('Auditoria do estabelecimento não configurada.')

        await establishmentAuditRecordsRepository.add({
          id: `${updatedEstablishment.id}:${updatedAt.toISOString()}:timezone`,
          establishmentId: updatedEstablishment.id,
          affectedEstablishmentName: updatedEstablishment.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: EstablishmentAuditAction.EstablishmentTimezoneChanged,
          previousValue: establishment.timeZone,
          newValue: updatedEstablishment.timeZone,
          occurredAt: updatedAt,
        })

        return this.toSettings(updatedEstablishment, request.actor)
      },
    )
  }

  private toSettings(
    establishment: EstablishmentSettings['establishment'],
    actor: Account,
  ): EstablishmentSettings {
    return {
      establishment,
      responsibleManager: { id: actor.id, name: actor.name },
    }
  }
}
