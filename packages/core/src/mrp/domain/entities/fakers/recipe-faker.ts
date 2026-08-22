import { faker } from '@faker-js/faker'

import type { Recipe } from '#mrp/domain/entities/recipe.ts'

export class RecipeFaker {
  static fake(overrides: Partial<Recipe> = {}): Recipe {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      yieldQuantity: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): Recipe[] {
    return Array.from({ length: count }, () => RecipeFaker.fake())
  }
}
