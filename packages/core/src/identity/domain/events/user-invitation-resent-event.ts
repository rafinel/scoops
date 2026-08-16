import { Event } from '#shared/domain/events/event.ts'

export class UserInvitationResentEvent extends Event<{
  userId: string
  establishmentId: string
  email: string
  actorUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'identity/user.invitation-resent'

  constructor(payload: UserInvitationResentEvent['payload']) {
    super(UserInvitationResentEvent._NAME, payload)
  }
}
