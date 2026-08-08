import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserCreatedEvent extends Event<{
  userId: User['id']
  establishmentId: User['establishmentId']
  profile: User['profile']
  status: User['status']
  createdAt: User['createdAt']
}> {
  static readonly _NAME = 'identity/user.created'

  constructor(payload: UserCreatedEvent['payload']) {
    super(UserCreatedEvent._NAME, payload)
  }
}
