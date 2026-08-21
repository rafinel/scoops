import { faker } from '@faker-js/faker'
import type { StockTransaction } from '#mrp/domain/entities/stock-transaction.ts'
import { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export class StockTransactionFaker {
  static fake(overrides: Partial<StockTransaction> = {}): StockTransaction {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      productId: faker.string.uuid(),
      productName: faker.commerce.productName(),
      unit: ProductUnit.Unit,
      type: StockAdjustmentType.Entry,
      quantity: faker.number.float({ min: 0.001, max: 100, fractionDigits: 3 }),
      balanceAfter: faker.number.float({ min: 0, max: 1000, fractionDigits: 3 }),
      performedBy: faker.string.uuid(),
      performedByName: faker.person.fullName(),
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): StockTransaction[] {
    return Array.from({ length: count }, () => StockTransactionFaker.fake())
  }
}
