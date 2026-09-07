import { faker } from '@faker-js/faker'

import type { Notification } from '#communication/domain/entities/notification.ts'
import { NotificationKind } from '#communication/domain/structures/notification-kind.ts'

export class NotificationFaker {
  static fake(overrides: Partial<Notification> = {}): Notification {
    const now = new Date('2026-01-01T00:00:00.000Z')

    return {
      id: faker.string.uuid(),
      sourceEventId: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      recipientUserId: faker.string.uuid(),
      kind: NotificationKind.StockBelowIdeal,
      title: 'Estoque abaixo do ideal',
      message: 'Leite está com 2 l disponíveis. Ideal: 10 l.',
      occurredAt: now,
      createdAt: now,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Notification[] {
    return Array.from({ length: count }, () => NotificationFaker.fake())
  }
}
