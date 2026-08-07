import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { SubscriptionReactivatedEvent } from '#billing/domain/events/subscription-reactivated-event.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type { BillingDatabase } from '#billing/interfaces/billing-database.ts'
import type { BillingProvider } from '#billing/interfaces/billing-provider.ts'
import { ConflictError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export type ResumeSubscriptionRequest = {
  readonly establishmentId: string
}

export class ResumeSubscriptionUseCase
  implements UseCase<ResumeSubscriptionRequest, Subscription>
{
  constructor(
    private readonly database: BillingDatabase,
    private readonly billingProvider: BillingProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: ResumeSubscriptionRequest): Promise<Subscription> {
    const subscription = await this.database.run((scope) =>
      scope.subscriptionsRepository.findByEstablishmentId(request.establishmentId),
    )

    if (!subscription) throw new NotFoundError('Assinatura não encontrada.')
    if (subscription.status === SubscriptionStatus.Deleted) {
      throw new ConflictError('Uma assinatura excluída não pode ser reativada.')
    }
    if (subscription.status !== SubscriptionStatus.CancellationScheduled)
      return subscription

    if (subscription.providerSubscriptionId) {
      await this.billingProvider.resumeSubscription(subscription.providerSubscriptionId)
    }

    const status =
      subscription.trialEndsAt && subscription.trialEndsAt > this.datetimeProvider.now()
        ? SubscriptionStatus.Trial
        : SubscriptionStatus.Active

    const resumedSubscription = await this.database.run((scope) =>
      scope.subscriptionsRepository.replace(request.establishmentId, {
        status,
        cancellationScheduledAt: undefined,
      }),
    )

    this.broker.publish(
      new SubscriptionReactivatedEvent({
        subscriptionId: resumedSubscription.id,
        establishmentId: resumedSubscription.establishmentId,
        status: resumedSubscription.status,
      }),
    )

    return resumedSubscription
  }
}
