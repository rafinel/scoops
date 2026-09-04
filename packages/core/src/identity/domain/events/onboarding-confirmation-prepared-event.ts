import { Event } from '#shared/domain/events/event.ts'

export class OnboardingConfirmationPreparedEvent extends Event<{
  userId: string
  email: string
  name: string
  actionUrl: string
  expiresAt: string
  occurredAt: string
}> {
  static readonly _NAME = 'identity/onboarding-confirmation.prepared'

  constructor(payload: OnboardingConfirmationPreparedEvent['payload']) {
    super(OnboardingConfirmationPreparedEvent._NAME, payload)
  }
}
