import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserRegistrationAttemptCreatedEvent extends Event<{
  registrationAttemptId: UserRegistrationAttempt['id']
  establishmentId: UserRegistrationAttempt['establishmentId']
  type: UserRegistrationAttempt['type']
  status: UserRegistrationAttempt['status']
  createdAt: UserRegistrationAttempt['createdAt']
  expiresAt: UserRegistrationAttempt['expiresAt']
}> {
  static readonly _NAME = 'identity/user-registration-attempt.created'

  constructor(payload: UserRegistrationAttemptCreatedEvent['payload']) {
    super(UserRegistrationAttemptCreatedEvent._NAME, payload)
  }
}
