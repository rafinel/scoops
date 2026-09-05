import { faker } from '@faker-js/faker'

import type { Brand } from '#mrp/domain/entities/brand.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export class BrandFaker {
  static fake(overrides: Partial<Brand> = {}): Brand {
    return {
      id: faker.string.uuid(),
      productId: faker.string.uuid(),
      name: faker.company.name(),
      unit: ProductUnit.Unit,
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): Brand[] {
    return Array.from({ length: count }, () => BrandFaker.fake())
  }
}
