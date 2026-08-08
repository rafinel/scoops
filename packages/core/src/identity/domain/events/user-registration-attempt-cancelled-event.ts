import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserRegistrationAttemptCancelledEvent extends Event<{
  registrationAttemptId: UserRegistrationAttempt['id']
  establishmentId: UserRegistrationAttempt['establishmentId']
  status: UserRegistrationAttempt['status']
  updatedAt: UserRegistrationAttempt['updatedAt']
}> {
  static readonly _NAME = 'identity/user-registration-attempt.cancelled'

  constructor(payload: UserRegistrationAttemptCancelledEvent['payload']) {
    super(UserRegistrationAttemptCancelledEvent._NAME, payload)
  }
}
