import { faker } from '@faker-js/faker'

import type { Combo } from '#pdv/domain/entities/combo.ts'
import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export class ComboFaker {
  static fake(overrides: Partial<Combo> = {}): Combo {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const portionProductId = faker.string.uuid()
    const resaleProductId = faker.string.uuid()

    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      name: faker.commerce.productName(),
      type: DiscountType.Combo,
      status: DiscountStatus.Active,
      fixedPrice: 30,
      components: [
        {
          kind: 'portion',
          productId: portionProductId,
          quantity: 1,
          sizeId: faker.string.uuid(),
          accompanimentIds: [],
        },
        {
          kind: 'resale',
          productId: resaleProductId,
          quantity: 1,
        },
      ],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Combo[] {
    return Array.from({ length: count }, () => ComboFaker.fake())
  }
}
