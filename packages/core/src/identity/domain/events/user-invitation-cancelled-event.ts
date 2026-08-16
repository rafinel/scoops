import { Event } from '#shared/domain/events/event.ts'

export class UserInvitationCancelledEvent extends Event<{
  userId: string
  establishmentId: string
  actorUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'identity/user.invitation-cancelled'

  constructor(payload: UserInvitationCancelledEvent['payload']) {
    super(UserInvitationCancelledEvent._NAME, payload)
  }
}
