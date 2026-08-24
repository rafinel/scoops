import { faker } from '@faker-js/faker'

import type { ProductSize } from '#mrp/domain/entities/product-size.ts'

export class ProductSizeFaker {
  static fake(overrides: Partial<ProductSize> = {}): ProductSize {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      name: 'Small',
      quantity: 1,
      price: 10,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): ProductSize[] {
    return Array.from({ length: count }, () => ProductSizeFaker.fake())
  }
}
