import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserInvitationAcceptedEvent extends Event<{
  userId: string
  establishmentId: string
  email: string
  profile: User['profile']
  occurredAt: Date
}> {
  static readonly _NAME = 'identity/user.invitation-accepted'

  constructor(payload: UserInvitationAcceptedEvent['payload']) {
    super(UserInvitationAcceptedEvent._NAME, payload)
  }
}
