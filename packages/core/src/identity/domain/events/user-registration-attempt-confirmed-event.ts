import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserRegistrationAttemptConfirmedEvent extends Event<{
  registrationAttemptId: UserRegistrationAttempt['id']
  establishmentId: UserRegistrationAttempt['establishmentId']
  status: UserRegistrationAttempt['status']
  updatedAt: UserRegistrationAttempt['updatedAt']
}> {
  static readonly _NAME = 'identity/user-registration-attempt.confirmed'

  constructor(payload: UserRegistrationAttemptConfirmedEvent['payload']) {
    super(UserRegistrationAttemptConfirmedEvent._NAME, payload)
  }
}
