import { faker } from '@faker-js/faker'
import type { User } from '#identity/domain/entities/user.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'

export function fakeUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: faker.string.uuid(),
    establishmentId: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    profile: UserProfile.Operator,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
