import { faker } from '@faker-js/faker'

import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'

export class AccompanimentTypeFaker {
  static fake(overrides: Partial<AccompanimentType> = {}): AccompanimentType {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      name: faker.commerce.productAdjective(),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): AccompanimentType[] {
    return Array.from({ length: count }, () => AccompanimentTypeFaker.fake())
  }
}
