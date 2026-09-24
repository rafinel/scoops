import type {
  AnalyticsAccessContext,
  AnalyticsActor,
} from '@scoops/core/analytics/domain/structures'
import type { AnalyticsContextProvider } from '@scoops/core/analytics/interfaces'
import { EstablishmentStatus } from '@scoops/core/identity/domain/structures'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'

export class IdentityAnalyticsContextProvider implements AnalyticsContextProvider {
  constructor(private readonly establishmentsRepository: EstablishmentsRepository) {}

  async resolve(actor: AnalyticsActor): Promise<AnalyticsAccessContext> {
    try {
      const establishment = await this.establishmentsRepository.findById(
        actor.establishmentId,
      )
      if (!establishment) {
        throw new ServiceUnavailableError(
          'O estabelecimento do usuário não está disponível.',
        )
      }

      return {
        establishmentId: establishment.id,
        establishmentIsActive: establishment.status === EstablishmentStatus.Active,
        timeZone: establishment.timeZone,
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error
      throw new ServiceUnavailableError(
        'O contexto de Analytics do estabelecimento não está disponível.',
      )
    }
  }
}
