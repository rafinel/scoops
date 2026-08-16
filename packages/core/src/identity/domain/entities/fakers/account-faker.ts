import { faker } from '@faker-js/faker'
import type { Account } from '#identity/domain/entities/account.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'

export class AccountFaker {
  static fake(overrides: Partial<Account> = {}): Account {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      profile: UserProfile.Manager,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Account[] {
    return Array.from({ length: count }, () => AccountFaker.fake())
  }
}
