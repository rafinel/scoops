import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { TrialStartedEvent } from '#billing/domain/events/trial-started-event.ts'
import { BillingPlanCode } from '#billing/domain/structures/billing-plan.ts'
import type { StartTrialRequest } from '#billing/domain/structures/start-trial-request.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type { BillingDatabase } from '#billing/interfaces/billing-database.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class StartTrialUseCase implements UseCase<StartTrialRequest, Subscription> {
  constructor(
    private readonly database: BillingDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: StartTrialRequest): Promise<Subscription> {
    const now = this.datetimeProvider.now()
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const subscription = await this.database.run(async (scope) => {
      const existingTrial = await scope.trialEligibilitiesRepository.findByEmailHash(
        request.emailHash,
      )

      if (existingTrial)
        throw new ConflictError('Este e-mail já utilizou o período de teste.')

      const existingSubscription =
        await scope.subscriptionsRepository.findByEstablishmentId(request.establishmentId)

      if (existingSubscription) {
        throw new ConflictError('O estabelecimento já possui uma assinatura.')
      }

      await scope.trialEligibilitiesRepository.add({
        emailHash: request.emailHash,
        establishmentId: request.establishmentId,
        startedAt: now,
        endsAt: trialEndsAt,
      })

      return scope.subscriptionsRepository.add({
        establishmentId: request.establishmentId,
        planCode: BillingPlanCode.Complete,
        status: SubscriptionStatus.Trial,
        trialStartedAt: now,
        trialEndsAt,
      })
    })

    this.broker.publish(
      new TrialStartedEvent({
        establishmentId: subscription.establishmentId,
        trialStartedAt: subscription.trialStartedAt as Date,
        trialEndsAt: subscription.trialEndsAt as Date,
      }),
    )

    return subscription
  }
}
