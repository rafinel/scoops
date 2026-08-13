import { faker } from '@faker-js/faker'
import type { Account } from '#identity/domain/entities/account.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'

export function fakeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: faker.string.uuid(),
    establishmentId: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    profile: UserProfile.Manager,
    ...overrides,
  }
}
