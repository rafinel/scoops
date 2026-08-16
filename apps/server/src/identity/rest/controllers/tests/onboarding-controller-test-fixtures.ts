import type {
  Establishment,
  User,
  UserRegistrationAttempt,
} from '@scoops/core/identity/domain/entities'
import {
  EstablishmentStatus,
  RegistrationAttemptStatus,
  RegistrationAttemptType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { OnboardingTokenProvider } from '@scoops/core/identity/interfaces'

import type { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'

export const continuationToken = 'c'.repeat(43)
export const confirmationToken = 'f'.repeat(43)
export const accessToken = 'pending-access-token'
export const establishmentId = '50000000-0000-0000-0000-000000000001'
export const userId = '50000000-0000-0000-0000-000000000002'
export const attemptId = '50000000-0000-0000-0000-000000000003'

export function createPendingOnboardingSeed(tokenProvider: OnboardingTokenProvider) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const establishment = {
    id: establishmentId,
    name: 'Gelato Central',
    status: EstablishmentStatus.Pending,
    createdAt: now,
    updatedAt: now,
  } satisfies Establishment
  const user = {
    id: userId,
    establishmentId,
    name: 'Ana Manager',
    email: 'ana@example.com',
    profile: UserProfile.Manager,
    status: UserStatus.Pending,
    createdAt: now,
    updatedAt: now,
  } satisfies User
  const registrationAttempt = {
    id: attemptId,
    userId,
    establishmentId,
    name: user.name,
    email: user.email,
    profile: user.profile,
    type: RegistrationAttemptType.EstablishmentOnboarding,
    status: RegistrationAttemptStatus.Pending,
    tokenHash: tokenProvider.hash(continuationToken),
    confirmationTokenHash: tokenProvider.hash(confirmationToken),
    expiresAt,
    createdAt: now,
    updatedAt: now,
  } satisfies UserRegistrationAttempt

  return { establishment, user, registrationAttempt }
}

export async function seedPendingOnboarding(
  fixture: IdentityModuleFixture,
  tokenProvider: OnboardingTokenProvider,
) {
  const seed = createPendingOnboardingSeed(tokenProvider)
  await fixture.seeder.run({
    establishments: [seed.establishment],
    users: [seed.user],
    registrationAttempts: [seed.registrationAttempt],
  })
  return seed
}
