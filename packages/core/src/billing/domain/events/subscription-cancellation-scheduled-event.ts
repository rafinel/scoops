import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SubscriptionCancellationScheduledEvent extends Event<{
  subscriptionId: Subscription['id']
  establishmentId: Subscription['establishmentId']
  cancellationScheduledAt: Date
}> {
  static readonly _NAME = 'billing/subscription.cancellation-scheduled'

  constructor(payload: SubscriptionCancellationScheduledEvent['payload']) {
    super(SubscriptionCancellationScheduledEvent._NAME, payload)
  }
}
