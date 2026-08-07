import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SubscriptionActivatedEvent extends Event<{
  subscriptionId: Subscription['id']
  establishmentId: Subscription['establishmentId']
  currentPeriodEndsAt?: Subscription['currentPeriodEndsAt']
}> {
  static readonly _NAME = 'billing/subscription.activated'

  constructor(payload: SubscriptionActivatedEvent['payload']) {
    super(SubscriptionActivatedEvent._NAME, payload)
  }
}
