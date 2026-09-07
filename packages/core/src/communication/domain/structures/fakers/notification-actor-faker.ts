import { faker } from '@faker-js/faker'

import {
  NotificationActorProfile,
  type NotificationActor,
} from '#communication/domain/structures/notification-actor.ts'

export class NotificationActorFaker {
  static fake(overrides: Partial<NotificationActor> = {}): NotificationActor {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      profile: NotificationActorProfile.Manager,
      ...overrides,
    }
  }

  static fakeMany(count = 10): NotificationActor[] {
    return Array.from({ length: count }, () => NotificationActorFaker.fake())
  }
}
