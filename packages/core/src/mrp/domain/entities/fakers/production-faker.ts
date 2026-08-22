import { faker } from '@faker-js/faker'

import type { Production } from '#mrp/domain/entities/production.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export class ProductionFaker {
  static fake(overrides: Partial<Production> = {}): Production {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      productName: faker.commerce.productName(),
      unit: ProductUnit.Unit,
      recipeId: faker.string.uuid(),
      recipeYield: 1,
      quantity: 1,
      totalCost: 0,
      performedBy: faker.string.uuid(),
      performedByName: faker.person.fullName(),
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): Production[] {
    return Array.from({ length: count }, () => ProductionFaker.fake())
  }
}
