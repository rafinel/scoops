import { faker } from '@faker-js/faker'

import type { Order } from '#pdv/domain/entities/order.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'

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
      createdByName: faker.person.fullName(),
      status: OrderStatus.Registered,
      lines: [orderLine],
      discounts: [],
      subtotal: 10,
      totalDiscount: 0,
      total: 10,
      createdAt: now,
      ...overrides,
    }
  }

  static fakeCanceled(overrides: Partial<Order> = {}): Order {
    const order = OrderFaker.fake({ ...overrides, status: 'canceled' })
    return {
      ...order,
      status: 'canceled',
      cancellation: overrides.cancellation ?? {
        canceledAt: new Date('2026-01-02T00:00:00.000Z'),
        canceledBy: faker.string.uuid(),
        canceledByName: faker.person.fullName(),
        restorations: order.lines.flatMap((line) =>
          line.consumptions.map((consumption) => ({
            productId: consumption.productId,
            productName: line.product.name,
            ...(consumption.productName ? { productName: consumption.productName } : {}),
            ...(consumption.brandId
              ? {
                  brandId: consumption.brandId,
                  brandName:
                    consumption.brandName ?? line.brand?.name ?? 'Marca removida',
                }
              : {}),
            quantity: consumption.quantity,
            outcome: 'restored' as const,
          })),
        ),
      },
    }
  }

  static fakeMany(count = 10): Order[] {
    return Array.from({ length: count }, () => OrderFaker.fake())
  }
}
