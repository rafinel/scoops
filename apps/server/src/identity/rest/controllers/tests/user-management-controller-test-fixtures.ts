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

import type { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'

export const establishmentId = '31000000-0000-0000-0000-000000000001'
export const managerId = '31000000-0000-0000-0000-000000000002'
export const operatorId = '31000000-0000-0000-0000-000000000003'
export const invitationId = '31000000-0000-0000-0000-000000000004'
export const managerToken = 'users-manager-token'
export const invitationToken = 'u'.repeat(43)

export function createEstablishment(): Establishment {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: establishmentId,
    name: 'Users Establishment',
    status: EstablishmentStatus.Active,
    createdAt: now,
    updatedAt: now,
  }
}

export function createUser(
  id: string,
  name: string,
  profile: UserProfile,
  status = UserStatus.Active,
): User {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id,
    establishmentId,
    name,
    email: `${id}@example.com`,
    profile,
    status,
    createdAt: now,
    updatedAt: now,
  }
}

export function createInvitation(tokenProvider: { hash(token: string): string }) {
  const now = new Date()
  return {
    id: invitationId,
    userId: operatorId,
    establishmentId,
    name: 'Pending Operator',
    email: 'pending@example.com',
    profile: UserProfile.Operator,
    type: RegistrationAttemptType.UserInvitation,
    status: RegistrationAttemptStatus.Pending,
    tokenHash: tokenProvider.hash(invitationToken),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
    revision: 0,
  } satisfies UserRegistrationAttempt
}

export async function seedUsers(
  fixture: IdentityModuleFixture,
  users: User[],
  registrationAttempts: UserRegistrationAttempt[] = [],
) {
  await fixture.seeder.run({
    establishments: [createEstablishment()],
    users,
    registrationAttempts,
  })
}
