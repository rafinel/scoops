import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SubscriptionBlockedEvent extends Event<{
  subscriptionId: Subscription['id']
  establishmentId: Subscription['establishmentId']
  status: Subscription['status']
}> {
  static readonly _NAME = 'billing/subscription.blocked'

  constructor(payload: SubscriptionBlockedEvent['payload']) {
    super(SubscriptionBlockedEvent._NAME, payload)
  }
}
