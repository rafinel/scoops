import { faker } from '@faker-js/faker'

import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'

export class ProductAccompanimentFaker {
  static fake(overrides: Partial<ProductAccompaniment> = {}): ProductAccompaniment {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      accompanimentProductId: faker.string.uuid(),
      accompanimentTypeId: faker.string.uuid(),
      quantityPerPortion: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): ProductAccompaniment[] {
    return Array.from({ length: count }, () => ProductAccompanimentFaker.fake())
  }
}
