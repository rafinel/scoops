import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserInactivatedEvent extends Event<{
  userId: User['id']
  establishmentId: User['establishmentId']
  email: User['email']
  actorUserId: string
  previousStatus: User['status']
  status: User['status']
  updatedAt: User['updatedAt']
}> {
  static readonly _NAME = 'identity/user.inactivated'

  constructor(payload: UserInactivatedEvent['payload']) {
    super(UserInactivatedEvent._NAME, payload)
  }
}
