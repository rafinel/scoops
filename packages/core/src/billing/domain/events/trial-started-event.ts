import type { Subscription } from '#billing/domain/entities/subscription.ts'
import { Event } from '#shared/domain/events/event.ts'

export class TrialStartedEvent extends Event<{
  establishmentId: Subscription['establishmentId']
  trialStartedAt: Date
  trialEndsAt: Date
}> {
  static readonly _NAME = 'billing/trial.started'

  constructor(payload: TrialStartedEvent['payload']) {
    super(TrialStartedEvent._NAME, payload)
  }
}
