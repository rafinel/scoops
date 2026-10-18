import { faker } from '@faker-js/faker'

import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'

export class GlobalAccompanimentFaker {
  static fake(overrides: Partial<GlobalAccompaniment> = {}): GlobalAccompaniment {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      accompanimentProductId: faker.string.uuid(),
      accompanimentTypeId: faker.string.uuid(),
      quantityPerPortion: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): GlobalAccompaniment[] {
    return Array.from({ length: count }, () => GlobalAccompanimentFaker.fake())
  }
}
