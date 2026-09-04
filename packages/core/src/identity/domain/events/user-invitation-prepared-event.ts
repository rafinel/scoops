import { Event } from '#shared/domain/events/event.ts'

export class UserInvitationPreparedEvent extends Event<{
  userId: string
  establishmentId: string
  email: string
  name: string
  actionUrl: string
  expiresAt: string
  occurredAt: string
  operation: 'initial' | 'corrected' | 'resent'
}> {
  static readonly _NAME = 'identity/user-invitation.prepared'

  constructor(payload: UserInvitationPreparedEvent['payload']) {
    super(UserInvitationPreparedEvent._NAME, payload)
  }
}
