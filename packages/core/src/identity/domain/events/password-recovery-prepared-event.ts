import { Event } from '#shared/domain/events/event.ts'

export class PasswordRecoveryPreparedEvent extends Event<{
  userId: string
  email: string
  name: string
  actionUrl: string
  expiresAt: string
  occurredAt: string
}> {
  static readonly _NAME = 'identity/password-recovery.prepared'

  constructor(payload: PasswordRecoveryPreparedEvent['payload']) {
    super(PasswordRecoveryPreparedEvent._NAME, payload)
  }
}
