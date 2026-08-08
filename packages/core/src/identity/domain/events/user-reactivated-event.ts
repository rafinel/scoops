import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserReactivatedEvent extends Event<{
  userId: User['id']
  establishmentId: User['establishmentId']
  profile: User['profile']
  status: User['status']
  updatedAt: User['updatedAt']
}> {
  static readonly _NAME = 'identity/user.reactivated'

  constructor(payload: UserReactivatedEvent['payload']) {
    super(UserReactivatedEvent._NAME, payload)
  }
}
