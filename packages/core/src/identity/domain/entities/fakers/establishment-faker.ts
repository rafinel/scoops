import { faker } from '@faker-js/faker'
import type { Establishment } from '#identity/domain/entities/establishment.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'

export class EstablishmentFaker {
  static fake(overrides: Partial<Establishment> = {}): Establishment {
    const now = new Date('2026-01-01T00:00:00.000Z')

    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      status: EstablishmentStatus.Active,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Establishment[] {
    return Array.from({ length: count }, () => EstablishmentFaker.fake())
  }
}
