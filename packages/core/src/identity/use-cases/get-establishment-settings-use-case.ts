import type { Account } from '#identity/domain/entities/account.ts'
import type { EstablishmentSettings } from '#identity/domain/structures/establishment-settings.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

type Request = { actor: Account }

export class GetEstablishmentSettingsUseCase
  implements UseCase<Request, EstablishmentSettings>
{
  constructor(private readonly database: IdentityDatabase) {}

  async execute(request: Request): Promise<EstablishmentSettings> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new ProfileChangeNotAllowedError()

    return this.database.run(async ({ establishmentsRepository }) => {
      const establishment = await establishmentsRepository.findById(
        request.actor.establishmentId,
      )
      if (!establishment) throw new NotFoundError('Establishment not found')

      return {
        establishment: {
          id: establishment.id,
          name: establishment.name,
          status: establishment.status,
          createdAt: establishment.createdAt,
          updatedAt: establishment.updatedAt,
        },
        responsibleManager: {
          id: request.actor.id,
          name: request.actor.name,
        },
      }
    })
  }
}
