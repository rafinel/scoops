import { faker } from '@faker-js/faker'

import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'

export class ResaleConfigurationFaker {
  static fake(overrides: Partial<ResaleConfiguration> = {}): ResaleConfiguration {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      price: 10,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): ResaleConfiguration[] {
    return Array.from({ length: count }, () => ResaleConfigurationFaker.fake())
  }
}
