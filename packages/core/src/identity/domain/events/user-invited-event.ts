import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserInvitedEvent extends Event<{
  userId: string
  establishmentId: string
  email: string
  profile: User['profile']
  actorUserId: string
  occurredAt: Date
}> {
  static readonly _NAME = 'identity/user.invited'

  constructor(payload: UserInvitedEvent['payload']) {
    super(UserInvitedEvent._NAME, payload)
  }
}
