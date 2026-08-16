import type { User } from '#identity/domain/entities/user.ts'
import { Event } from '#shared/domain/events/event.ts'

export class UserProfileUpdatedEvent extends Event<{
  userId: User['id']
  establishmentId: User['establishmentId']
  email: User['email']
  actorUserId: string
  previousProfile: User['profile']
  profile: User['profile']
  updatedAt: User['updatedAt']
}> {
  static readonly _NAME = 'identity/user.profile-updated'

  constructor(payload: UserProfileUpdatedEvent['payload']) {
    super(UserProfileUpdatedEvent._NAME, payload)
  }
}
