import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserRegistrationAttemptUpdatedEvent extends Event<{
  registrationAttemptId: UserRegistrationAttempt['id']
  establishmentId: UserRegistrationAttempt['establishmentId']
  status: UserRegistrationAttempt['status']
  updatedAt: UserRegistrationAttempt['updatedAt']
  expiresAt: UserRegistrationAttempt['expiresAt']
}> {
  static readonly _NAME = 'identity/user-registration-attempt.updated'

  constructor(payload: UserRegistrationAttemptUpdatedEvent['payload']) {
    super(UserRegistrationAttemptUpdatedEvent._NAME, payload)
  }
}
