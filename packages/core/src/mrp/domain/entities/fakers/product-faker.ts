import { faker } from '@faker-js/faker'

import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'

export class ProductFaker {
  static fake(overrides: Partial<Product> = {}): Product {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      name: faker.commerce.productName(),
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: faker.number.float({ min: 0, max: 100, fractionDigits: 6 }),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): Product[] {
    return Array.from({ length: count }, () => ProductFaker.fake())
  }
}
