import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SubscriptionReactivatedEvent extends Event<{
  subscriptionId: Subscription['id']
  establishmentId: Subscription['establishmentId']
  status: Subscription['status']
}> {
  static readonly _NAME = 'billing/subscription.reactivated'

  constructor(payload: SubscriptionReactivatedEvent['payload']) {
    super(SubscriptionReactivatedEvent._NAME, payload)
  }
}
