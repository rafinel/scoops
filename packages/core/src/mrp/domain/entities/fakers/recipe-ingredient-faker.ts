import { faker } from '@faker-js/faker'

import type { RecipeIngredient } from '#mrp/domain/entities/recipe-ingredient.ts'

export class RecipeIngredientFaker {
  static fake(overrides: Partial<RecipeIngredient> = {}): RecipeIngredient {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      recipeId: faker.string.uuid(),
      ingredientProductId: faker.string.uuid(),
      quantity: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): RecipeIngredient[] {
    return Array.from({ length: count }, () => RecipeIngredientFaker.fake())
  }
}
