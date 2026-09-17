import type {
  AnalyticsAccessContext,
  AnalyticsActor,
} from '@scoops/core/analytics/domain/structures'
import { EstablishmentStatus } from '@scoops/core/identity/domain/structures'
import { BillingAccessLevel } from '@scoops/core/billing/domain/structures'
import { GetBillingAccessUseCase } from '@scoops/core/billing/use-cases'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import type { SubscriptionsRepository } from '@scoops/core/billing/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import type { AnalyticsContextProvider } from '@scoops/core/analytics/interfaces'
import { ServiceUnavailableError } from '@scoops/core/shared/domain/errors'

export class IdentityBillingAnalyticsContextProvider implements AnalyticsContextProvider {
  constructor(
    private readonly establishmentsRepository: EstablishmentsRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

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

      const subscription = await this.subscriptionsRepository.findByEstablishmentId(
        actor.establishmentId,
      )
      if (!subscription) {
        return {
          establishmentId: establishment.id,
          establishmentIsActive: establishment.status === EstablishmentStatus.Active,
          timeZone: establishment.timeZone,
          commercialAccess: 'none',
        }
      }

      const access = await new GetBillingAccessUseCase().execute({
        subscription,
        now: this.datetimeProvider.now(),
      })

      return {
        establishmentId: establishment.id,
        establishmentIsActive: establishment.status === EstablishmentStatus.Active,
        timeZone: establishment.timeZone,
        commercialAccess: this.toCommercialAccess(access.level),
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error
      throw new ServiceUnavailableError(
        'O acesso comercial do estabelecimento não está disponível.',
      )
    }
  }

  private toCommercialAccess(
    level: BillingAccessLevel,
  ): AnalyticsAccessContext['commercialAccess'] {
    if (level === BillingAccessLevel.Full) return 'full'
    if (level === BillingAccessLevel.Restricted) return 'restricted'
    return 'none'
  }
}
