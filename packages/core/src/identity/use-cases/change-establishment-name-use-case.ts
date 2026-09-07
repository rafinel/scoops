import type { Account } from '#identity/domain/entities/account.ts'
import { EstablishmentAuditAction } from '#identity/domain/structures/establishment-audit-action.ts'
import type { EstablishmentSettings } from '#identity/domain/structures/establishment-settings.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { EstablishmentUpdatedEvent } from '#identity/domain/events/establishment-updated-event.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { AppError } from '#shared/domain/errors/app-error.ts'

type Request = { actor: Account; name: string }

export class ChangeEstablishmentNameUseCase
  implements UseCase<Request, EstablishmentSettings>
{
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<EstablishmentSettings> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new ProfileChangeNotAllowedError()

    const name = request.name.trim()
    if (!name) throw new ProfileChangeNotAllowedError()

    const updatedAt = this.datetimeProvider.now()
    const result = await this.database.run(
      async ({
        establishmentsRepository,
        establishmentAuditRecordsRepository,
        eventsRepository,
      }: IdentityDatabaseRepositories) => {
        const establishment = await establishmentsRepository.findById(
          request.actor.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Establishment not found')

        if (establishment.name === name) {
          return {
            settings: this.toSettings(establishment, request.actor),
            changed: false,
            previousName: establishment.name,
          }
        }

        const updatedEstablishment = await establishmentsRepository.replace(
          request.actor.establishmentId,
          { name, updatedAt },
        )
        const auditRepository = establishmentAuditRecordsRepository
        if (!auditRepository)
          throw new AppError('Establishment audit repository is not configured')

        await auditRepository.add({
          id: `${updatedEstablishment.id}:${updatedAt.toISOString()}:name`,
          establishmentId: updatedEstablishment.id,
          affectedEstablishmentName: updatedEstablishment.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: EstablishmentAuditAction.EstablishmentNameChanged,
          previousValue: establishment.name,
          newValue: updatedEstablishment.name,
          occurredAt: updatedAt,
        })

        await eventsRepository.add(
          new EstablishmentUpdatedEvent({
            establishmentId: updatedEstablishment.id,
            actorUserId: request.actor.id,
            previousName: establishment.name,
            name: updatedEstablishment.name,
            updatedAt,
          }),
        )

        return {
          settings: this.toSettings(updatedEstablishment, request.actor),
          changed: true,
          previousName: establishment.name,
        }
      },
    )

    return result.settings
  }

  private toSettings(
    establishment: {
      id: string
      name: string
      status: EstablishmentSettings['establishment']['status']
      createdAt: Date
      updatedAt: Date
    },
    actor: Account,
  ): EstablishmentSettings {
    return {
      establishment: {
        id: establishment.id,
        name: establishment.name,
        status: establishment.status,
        createdAt: establishment.createdAt,
        updatedAt: establishment.updatedAt,
      },
      responsibleManager: { id: actor.id, name: actor.name },
    }
  }
}
