import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { SubscriptionCancellationScheduledEvent } from '#billing/domain/events/subscription-cancellation-scheduled-event.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type { BillingDatabase } from '#billing/interfaces/billing-database.ts'
import type { BillingProvider } from '#billing/interfaces/billing-provider.ts'
import { ConflictError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export type CancelSubscriptionRequest = {
  readonly establishmentId: string
}

export class CancelSubscriptionUseCase
  implements UseCase<CancelSubscriptionRequest, Subscription>
{
  constructor(
    private readonly database: BillingDatabase,
    private readonly billingProvider: BillingProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: CancelSubscriptionRequest): Promise<Subscription> {
    const subscription = await this.database.run((scope) =>
      scope.subscriptionsRepository.findByEstablishmentId(request.establishmentId),
    )

    if (!subscription) throw new NotFoundError('Assinatura não encontrada.')
    if (subscription.status === SubscriptionStatus.Deleted) {
      throw new ConflictError('Uma assinatura excluída não pode ser cancelada.')
    }
    if (subscription.status === SubscriptionStatus.CancellationScheduled)
      return subscription

    if (subscription.providerSubscriptionId) {
      await this.billingProvider.cancelSubscription(subscription.providerSubscriptionId)
    }

    const cancellationScheduledAt =
      subscription.currentPeriodEndsAt ??
      subscription.trialEndsAt ??
      this.datetimeProvider.now()

    const cancelledSubscription = await this.database.run((scope) =>
      scope.subscriptionsRepository.replace(request.establishmentId, {
        status: SubscriptionStatus.CancellationScheduled,
        cancellationScheduledAt,
      }),
    )

    this.broker.publish(
      new SubscriptionCancellationScheduledEvent({
        subscriptionId: cancelledSubscription.id,
        establishmentId: cancelledSubscription.establishmentId,
        cancellationScheduledAt,
      }),
    )

    return cancelledSubscription
  }
}
