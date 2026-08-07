import type { Subscription } from '#billing/domain/entities/subscription.ts'
import type { BillingAccess } from '#billing/domain/structures/billing-access.ts'
import { BillingAccessLevel } from '#billing/domain/structures/billing-access-level.ts'
import { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type GetBillingAccessRequest = {
  subscription: Subscription
  now: Date
}

export class GetBillingAccessUseCase
  implements UseCase<GetBillingAccessRequest, BillingAccess>
{
  async execute(request: GetBillingAccessRequest): Promise<BillingAccess> {
    const { subscription, now } = request

    if (subscription.status === SubscriptionStatus.Deleted) {
      return { level: BillingAccessLevel.None, status: subscription.status }
    }

    if (
      subscription.status === SubscriptionStatus.Blocked ||
      subscription.status === SubscriptionStatus.DeletionScheduled
    ) {
      return {
        level: BillingAccessLevel.Restricted,
        status: subscription.status,
        reason: 'A assinatura não está ativa.',
        retentionEndsAt: subscription.retentionEndsAt,
      }
    }

    if (
      subscription.status === SubscriptionStatus.InitialPaymentPending &&
      (!subscription.trialEndsAt || subscription.trialEndsAt <= now)
    ) {
      return {
        level: BillingAccessLevel.Restricted,
        status: subscription.status,
        reason: 'O pagamento inicial ainda não foi confirmado.',
      }
    }

    return { level: BillingAccessLevel.Full, status: subscription.status }
  }
}
