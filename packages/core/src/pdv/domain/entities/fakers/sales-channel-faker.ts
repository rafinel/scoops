import { faker } from '@faker-js/faker'

import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'

export class SalesChannelFaker {
  static fake(overrides: Partial<SalesChannel> = {}): SalesChannel {
    const now = new Date('2026-01-01T00:00:00.000Z')

    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      name: faker.commerce.productName(),
      percentage: 10,
      status: SalesChannelStatus.Active,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  static fakeMany(count = 10): SalesChannel[] {
    return Array.from({ length: count }, () => SalesChannelFaker.fake())
  }
}
