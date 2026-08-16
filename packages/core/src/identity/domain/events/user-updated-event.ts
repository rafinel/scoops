import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserUpdatedEvent extends Event<{
  userId: User['id']
  establishmentId: User['establishmentId']
  actorUserId: string
  previousName: string
  name: User['name']
  updatedAt: User['updatedAt']
}> {
  static readonly _NAME = 'identity/user.updated'

  constructor(payload: UserUpdatedEvent['payload']) {
    super(UserUpdatedEvent._NAME, payload)
  }
}
