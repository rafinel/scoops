import { faker } from '@faker-js/faker'
import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'

export function fakeUserRegistrationAttempt(
  overrides: Partial<UserRegistrationAttempt> = {},
): UserRegistrationAttempt {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    establishmentId: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    profile: UserProfile.Manager,
    type: RegistrationAttemptType.EstablishmentOnboarding,
    status: RegistrationAttemptStatus.Pending,
    tokenHash: faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' }),
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
