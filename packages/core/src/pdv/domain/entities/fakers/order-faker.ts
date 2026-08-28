import { faker } from '@faker-js/faker'

import type { Order } from '#pdv/domain/entities/order.ts'

export class OrderFaker {
  static fake(overrides: Partial<Order> = {}): Order {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const establishmentId = faker.string.uuid()
    const productId = faker.string.uuid()
    const orderLine = {
      product: {
        productId,
        name: faker.commerce.productName(),
        kind: 'resale' as const,
      },
      accompaniments: [],
      quantity: 1,
      baseUnitPrice: 10,
      finalUnitPrice: 10,
      subtotal: 10,
      consumptions: [{ productId, quantity: 1 }],
    }

    return {
      id: faker.string.uuid(),
      establishmentId,
      idempotencyKey: faker.string.uuid(),
      sequenceNumber: faker.number.int({ min: 1, max: 1000 }),
      createdBy: faker.string.uuid(),
      lines: [orderLine],
      discounts: [],
      subtotal: 10,
      totalDiscount: 0,
      total: 10,
      createdAt: now,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Order[] {
    return Array.from({ length: count }, () => OrderFaker.fake())
  }
}
