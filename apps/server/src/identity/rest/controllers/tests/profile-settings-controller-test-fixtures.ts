import type { Establishment, User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'

export const establishmentId = '30000000-0000-0000-0000-000000000001'
export const managerId = '00000000-0000-0000-0000-000000000021'
export const operatorId = '00000000-0000-0000-0000-000000000022'
export const managerToken = 'profile-settings-manager-token'
export const operatorToken = 'profile-settings-operator-token'

export function createEstablishment(
  overrides: Partial<Establishment> = {},
): Establishment {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: establishmentId,
    name: 'Scoops Centro',
    status: EstablishmentStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createUser(
  id: string,
  profile: UserProfile,
  overrides: Partial<User> = {},
): User {
  const now = new Date('2026-01-01T00:00:00.000Z')

  return {
    id,
    establishmentId,
    name: profile === UserProfile.Manager ? 'Maria Manager' : 'Otávio Operator',
    email: `${id}@example.com`,
    profile,
    status: UserStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
